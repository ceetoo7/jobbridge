// server/controllers/matchController.js
import Gig from "../models/Gig.js";

export const getMatchedGigs = async (req, res) => {
    try {
        const userId = req.user.id; // set by protect middleware
        // Example logic: fetch gigs where user's skills match
        const userSkills = req.user.skills || [];
        const matchedGigs = await Gig.find({
            skills: { $in: userSkills },
        });

        res.status(200).json(matchedGigs);
    } catch (err) {
        console.error("Error fetching matched gigs:", err);
        res.status(500).json({ message: "Server error" });
    }
};
