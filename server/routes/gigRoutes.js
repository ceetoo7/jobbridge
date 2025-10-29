import express from "express";
import Gig from "../models/Gig.js";
import { getFairWage, isExploitative } from "../utils/fairWage.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ✅ PUBLIC: get all gigs
router.get("/", async (req, res) => {
    try {
        const gigs = await Gig.find().populate("employer", "name");
        res.status(200).json(gigs);
    } catch (error) {
        console.error("Error fetching gigs:", error);
        res.status(500).json({ message: "Error fetching gigs" });
    }
});

// ✅ PUBLIC: get gig by ID
router.get("/:id", async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id).populate("employer", "name");

        if (!gig) {
            return res.status(404).json({ message: "Gig not found" });
        }

        res.status(200).json(gig);
    } catch (error) {
        console.error("Error fetching gig by ID:", error);
        res.status(500).json({ message: "Error fetching gig" });
    }
});

// ✅ PROTECTED: get gigs by logged-in employer
router.get("/mine", verifyToken, async (req, res) => {
    try {
        const gigs = await Gig.find({ employer: req.user.id });
        res.json(gigs);
    } catch (err) {
        res.status(500).json({ error: "Failed to load your gigs" });
    }
});

// ✅ PROTECTED: post a new gig
router.post("/", verifyToken, async (req, res) => {
    try {
        const { title, description, skill, location, offeredRate } = req.body;
        const employer = req.user.id;

        const fairRate = getFairWage(location, skill);
        if (!fairRate) {
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
        res.status(201).json(gig);
    } catch (err) {
        console.error("Error creating gig:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
