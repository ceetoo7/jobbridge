// server/routes/matchRoutes.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import User from "../models/User.js";
import Gig from "../models/Gig.js";

const router = express.Router();

// GET /api/match/gigs - get gigs matched to logged in user
router.get("/gigs", verifyToken, async (req, res) => {
    try {
        console.log("🟣 MATCH ROUTE HIT");

        // 1️⃣ Get the authenticated user
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        console.log("✔ Authenticated User ID:", req.user.id);
        console.log("🟢 User skills:", user.skills);

        // 2️⃣ Get all gigs
        const gigs = await Gig.find().populate("employer", "name");
        console.log("🟢 Total gigs in DB:", gigs.length);

        // 3️⃣ Weighted matching function
        const matchedGigs = gigs
            .map(gig => {
                let score = 0;

                // Skill match (50%)
                if (user.skills.includes(gig.skill)) score += 50;

                // Location match (30%)
                if (user.location && gig.location && user.location === gig.location) score += 30;

                // Rate fairness (20%) -> if offeredRate >= fairRate
                if (gig.offeredRate >= gig.fairRate) score += 20;

                return { gig, score };
            })
            .filter(item => item.score > 0) // only gigs with some match
            .sort((a, b) => b.score - a.score) // best score first
            .map(item => item.gig); // return gigs only

        console.log("🟢 Matched gigs count:", matchedGigs.length);
        res.status(200).json(matchedGigs);

    } catch (err) {
        console.error("🔥 Matching error:", err);
        res.status(500).json({ message: "Failed to fetch matched gigs", err });
    }
});

export default router;
