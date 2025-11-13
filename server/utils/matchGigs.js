
export const matchGigs = (worker, gigs) => {
    return gigs
        .map(gig => {
            let score = 0;

            // Skills matching
            const skillMatches = worker.skills.filter(skill =>
                gig.skillsRequired.includes(skill)
            );
            score += skillMatches.length * 5;

            // Location matching
            if (worker.location === gig.location) {
                score += 3;
            }

            // Rate matching
            if (gig.budget >= worker.expectedRate) {
                score += 2;
            }

            return { gig, score };
        })
        .filter(item => item.score > 0) // only relevant gigs
        .sort((a, b) => b.score - a.score) // best match first
        .map(item => item.gig);
};
