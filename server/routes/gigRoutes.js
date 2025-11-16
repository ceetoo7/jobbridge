import express from "express";
import Gig from "../models/Gig.js";
import { getFairWage, isExploitative } from "../utils/fairWage.js";
import { protect } from "../middleware/auth.js"; // ES module import

const router = express.Router();

// 🚨 KEEP SPECIAL ROUTES FIRST
router.get("/mine/:id", protect, async (req, res) => {
    try {
        console.log("🟣 /mine/:id route hit for user:", req.user.id);
        const gigs = await Gig.find({ employer: req.params.id });
        res.json(gigs);
    } catch (err) {
        console.error("🔥 Failed to load your gigs:", err);
        res.status(500).json({ error: "Failed to load your gigs", err });
    }
});

// PUBLIC: get all gigs
router.get("/", async (req, res) => {
    try {
        const gigs = await Gig.find().populate("employer", "name");
        res.status(200).json(gigs);
    } catch (error) {
        console.error("🔥 Error fetching gigs:", error);
        res.status(500).json({ message: "Error fetching gigs" });
    }
});

// PUBLIC: get gig by ID
router.get("/:id", async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id).populate("employer", "name");
        if (!gig) {
            console.log("❌ Gig not found for ID:", req.params.id);
            return res.status(404).json({ message: "Gig not found" });
        }
        res.status(200).json(gig);
    } catch (error) {
        console.error("🔥 Error fetching gig:", error);
        res.status(500).json({ message: "Error fetching gig" });
    }
});

// PROTECTED: post a new gig
router.post("/", protect, async (req, res) => {
    try {
        const { title, description, skill, location, offeredRate } = req.body;
        const employer = req.user.id;
        console.log("🟢 Creating gig for employer:", employer);

        const fairRate = getFairWage(location, skill);
        if (!fairRate) {
            console.log("❌ Invalid location or skill:", location, skill);
            return res.status(400).json({ error: "Invalid location or skill" });
        }

        const gig = new Gig({
            employer,
            title,
            description,
            skill,
            location,
            offeredRate: Number(offeredRate),
            fairRate,
            isExploitative: isExploitative(Number(offeredRate), fairRate),
        });

        await gig.save();
        console.log("✅ Gig created:", gig._id);
        res.status(201).json(gig);
    } catch (err) {
        console.error("🔥 Error creating gig:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
