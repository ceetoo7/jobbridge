import Gig from "../models/Gig.js";
import User from "../models/User.js";
import { hybridMatch } from "../utils/vectorMatcher.js";

/**
 * Get matched gigs using hybrid algorithm:
 * - Vector-based matching (CV content analysis)
 * - Traditional weighted matching (skills, location, rate)
 */
export const getMatchedGigs = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get full user data including CV
        const user = await User.findById(userId).select('cvText cvSummary skills expectedRate location');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get all active gigs and convert to plain objects
        const allGigs = await Gig.find({}).populate("employer", "name").lean();

        // Apply hybrid matching algorithm
        const matchedGigs = hybridMatch(user, allGigs, {
            vectorWeight: 0.5,      // 50% from CV vector similarity
            traditionalWeight: 0.5, // 50% from traditional weighted matching
            threshold: 20           // Minimum score to include
        });

        res.status(200).json({
            matches: matchedGigs,
            totalMatches: matchedGigs.length,
            hasCV: !!(user.cvText && user.cvText.trim().length > 0),
            algorithm: "hybrid", // For transparency
            scoring: {
                vectorWeight: 0.5,
                traditionalWeight: 0.5
            }
        });
    } catch (err) {
        console.error("Error fetching matched gigs:", err);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Get pure vector-based matches (for comparison/debugging)
 */
export const getVectorMatches = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('+cvText +cvSummary skills expectedRate');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log('Vector match - User CV check:', { hasCvText: !!user.cvText, cvTextLength: user.cvText?.length });

        if (!user.cvText || user.cvText.trim().length === 0) {
            return res.status(400).json({
                message: "No CV uploaded. Please upload your CV first.",
                hasCV: false
            });
        }

        const allGigs = await Gig.find({}).populate("employer", "name").lean();

        // Import the vector matching function
        const { matchByVector } = await import("../utils/vectorMatcher.js");
        const matchedGigs = matchByVector(user, allGigs);

        // Filter to only return top matches
        const topMatches = matchedGigs
            .filter(gig => gig.vectorScore >= 30)
            .slice(0, 20);

        res.status(200).json({
            matches: topMatches,
            totalMatches: topMatches.length,
            cvSummary: user.cvSummary,
            algorithm: "vector-only"
        });
    } catch (err) {
        console.error("Error fetching vector matches:", err);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Get traditional skill-based matches only
 */
export const getTraditionalMatches = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userSkills = user.skills || [];
        const matchedGigs = await Gig.find({
            skills: { $in: userSkills },
        }).populate("employer", "name").lean();

        res.status(200).json({
            matches: matchedGigs,
            totalMatches: matchedGigs.length,
            matchedSkills: userSkills,
            algorithm: "traditional"
        });
    } catch (err) {
        console.error("Error fetching traditional matches:", err);
        res.status(500).json({ message: "Server error" });
    }
};
