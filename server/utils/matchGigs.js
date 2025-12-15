export const matchGigs = (worker, gigs, threshold = 7.5) => {
    const normalize = str => str?.toString().trim().toLowerCase();

    const workerSkills = Array.isArray(worker.skills)
        ? worker.skills.map(normalize)
        : [];

    if (workerSkills.length === 0) {
        console.warn("Worker has no skills defined!");
        return [];
    }

    return gigs
        .map(gig => {
            let score = 0;

            // Use single skill string from gig
            if (!gig.skill) {
                console.warn("Gig has no skill:", gig._id);
                return null;
            }

            const gigSkill = normalize(gig.skill);

            // Skill matching
            const matchedSkills = workerSkills.filter(skill => skill === gigSkill);
            if (matchedSkills.length === 0) return null;
            score += matchedSkills.length * 5;

            // Location matching
            const gigLocation = gig.location?.district || "";
            if (worker.location && normalize(worker.location) === normalize(gigLocation)) {
                score += 2.5;
            }

            // Wage matching
            if (
                gig.offeredRate != null &&
                worker.expectedRate != null &&
                gig.offeredRate >= worker.expectedRate
            ) {
                score += 2.5;
            }

            // Debug logs
            console.log("Gig ID:", gig._id);
            console.log("Worker skills:", workerSkills);
            console.log("Gig skill:", gigSkill);
            console.log("Gig location:", gigLocation);
            console.log("Score:", score);

            return { gig, score };
        })
        .filter(Boolean)
        .filter(item => item.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .map(item => item.gig.toObject());
};
