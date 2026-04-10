import Gig from "../models/Gig.js";
import User from "../models/User.js";
import { matchByVector } from "../utils/vectorMatcher.js";

const normalize = (value) => value?.toString().trim().toLowerCase();
const skillSynonyms = {
    plumber: ['plumber', 'plumbing', 'pipe', 'pipes', 'drain', 'leak', 'faucet'],
    electrician: ['electrician', 'electrical', 'wiring', 'circuit', 'voltage', 'electric'],
    carpenter: ['carpenter', 'carpentry', 'woodwork', 'furniture'],
    painter: ['painter', 'painting', 'paint'],
    mason: ['mason', 'masonry', 'brick', 'cement', 'concrete'],
    driver: ['driver', 'driving', 'vehicle', 'transport'],
    mechanic: ['mechanic', 'engine', 'repair'],
    tailor: ['tailor', 'sewing', 'stitching', 'fabric'],
    cook: ['cook', 'cooking', 'chef', 'kitchen'],
    cleaner: ['cleaner', 'cleaning', 'housekeeping']
};

const skillCategory = (value) => {
    const normalized = normalize(value);
    if (!normalized) return null;

    for (const [category, aliases] of Object.entries(skillSynonyms)) {
        if (aliases.includes(normalized)) return category;
    }
    return null;
};

const hasTraditionalSkillMatch = (workerSkills, gigSkills) => {
    const normalizedWorker = workerSkills.map(normalize).filter(Boolean);
    const normalizedGig = gigSkills.map(normalize).filter(Boolean);

    return normalizedWorker.some((workerSkill) => {
        const workerCat = skillCategory(workerSkill);

        return normalizedGig.some((gigSkill) => {
            if (workerSkill === gigSkill) return true;

            const gigCat = skillCategory(gigSkill);
            if (workerCat && gigCat && workerCat === gigCat) return true;

            return false;
        });
    });
};

export const getMatchedGigs = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('skills cvSummary expectedRate location cvText');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const profileSkills = Array.isArray(user.skills) ? user.skills : [];
        const cvDetectedSkills = Array.isArray(user.cvSummary?.detectedSkills)
            ? user.cvSummary.detectedSkills
            : [];
        const workerSkills = [...new Set([...profileSkills, ...cvDetectedSkills].map(normalize).filter(Boolean))];
        const hasCV = !!(user.cvText && user.cvText.trim().length > 0) || cvDetectedSkills.length > 0;

        if (workerSkills.length === 0) {
            const latestGigs = await Gig.find({})
                .populate("employer", "name")
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            return res.status(200).json({
                matches: latestGigs,
                totalMatches: latestGigs.length,
                hasCV,
                algorithm: "traditional"
            });
        }

        const allGigs = await Gig.find({}).populate("employer", "name").lean();

        const matchedGigs = allGigs
            .map((gig) => {
                const gigSkills = [
                    gig.skill,
                    ...(Array.isArray(gig.skills) ? gig.skills : [])
                ].map(normalize).filter(Boolean);

                const hasSkillMatch = hasTraditionalSkillMatch(workerSkills, gigSkills);
                if (!hasSkillMatch) return null;

                let score = 10;

                const locationMatch = user.location?.district &&
                    normalize(user.location.district) === normalize(gig.location?.district);
                if (locationMatch) score += 3;

                const rateMatch = gig.offeredRate != null &&
                    user.expectedRate != null &&
                    gig.offeredRate >= user.expectedRate;
                if (rateMatch) score += 2;

                return { ...gig, _matchRank: score };
            })
            .filter(Boolean)
            .sort((a, b) => b._matchRank - a._matchRank)
            .slice(0, 20)
            .map(({ _matchRank, ...gig }) => gig);

        res.status(200).json({
            matches: matchedGigs,
            totalMatches: matchedGigs.length,
            hasCV,
            algorithm: "traditional"
        });
    } catch (err) {
        console.error("Error fetching matched gigs:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getVectorMatches = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('cvText cvSummary skills expectedRate');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log('Vector match - User CV check:', { hasCvText: !!user.cvText, cvTextLength: user.cvText?.length });

        const hasCVText = !!(user.cvText && user.cvText.trim().length > 0);
        const hasDetectedSkills = Array.isArray(user.cvSummary?.detectedSkills) &&
            user.cvSummary.detectedSkills.length > 0;
        const hasVectorProfile = hasCVText || hasDetectedSkills;

        if (!hasVectorProfile) {
            return res.status(400).json({
                message: "No CV uploaded. Please upload your CV first.",
                hasCV: false
            });
        }

        const allGigs = await Gig.find({}).populate("employer", "name").lean();

        const scoredAfterSkillGate = matchByVector(user, allGigs, { threshold: 0 });
        const afterThreshold = scoredAfterSkillGate.filter((gig) => (gig.vectorScore || 0) >= 5);
        const topMatches = (afterThreshold.length > 0 ? afterThreshold : scoredAfterSkillGate).slice(0, 20);

        res.status(200).json({
            matches: topMatches,
            totalMatches: topMatches.length,
            cvSummary: user.cvSummary,
            hasCV: hasVectorProfile,
            algorithm: "vector-only",
            debug: {
                totalGigs: allGigs.length,
                afterSkillGate: scoredAfterSkillGate.length,
                afterThreshold: afterThreshold.length,
                returned: topMatches.length
            }
        });
    } catch (err) {
        console.error("Error fetching vector matches:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getTraditionalMatches = getMatchedGigs;
