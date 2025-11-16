// server/routes/matchRoutes.js
import express from "express";
import Gig from "../models/Gig.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET matched gigs for authenticated user
router.get("/gigs", verifyToken, async (req, res) => {
    try {
        console.log("🟣 MATCH ROUTE HIT");

        // fetch user
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log("❌ User not found for ID:", req.user.id);
            return res.status(404).json({ message: "User not found" });
        }
        console.log("✔ Authenticated User ID:", req.user.id);
        console.log("🟢 User skills:", user.skills);

        // fetch all gigs
        const gigs = await Gig.find();
        if (!gigs || gigs.length === 0) {
            console.log("⚠️ No gigs found in DB");
        }
        console.log("🟢 Total gigs in DB:", gigs.length);

        // filter matched gigs safely
        const matchedGigs = (gigs || []).filter(gig => (user.skills || []).includes(gig.skill));
        console.log("🟢 Matched gigs count:", matchedGigs.length);
        console.log("🟢 Matched gigs:", matchedGigs);

        res.status(200).json(matchedGigs);
    } catch (error) {
        console.error("🔥 Matching error:", error);
        res.status(500).json({ message: "Error matching gigs", error: error.message });
    }
});

export default router;
