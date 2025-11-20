import express from "express";
import Gig from "../models/Gig.js";
import User from "../models/User.js";
import { getFairWage, isExploitative } from "../utils/fairWage.js";
import { verifyToken } from "../middleware/auth.js";
import Application from '../models/Application.js';


const router = express.Router();

/* --------------------------------------------
   EMPLOYER → GET ALL MY GIGS
   Must go BEFORE "/:id"
----------------------------------------------- */
router.get("/mine", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "employer") {
            return res.status(403).json({ error: "Only employers can view their gigs" });
        }



        const employerId = req.user._id || req.user.id;

        const gigs = await Gig.find({ employer: employerId });



        res.json(gigs);
    } catch (err) {
        console.error("Failed to fetch employer gigs:", err);
        res.status(500).json({ error: "Server error" });
    }
});


/* --------------------------------------------
   PUBLIC → GET ALL GIGS
----------------------------------------------- */
router.get("/", async (req, res) => {
    try {
        const gigs = await Gig.find().populate("employer", "name");
        res.status(200).json(gigs);
    } catch (error) {
        console.error("🔥 Error fetching gigs:", error);
        res.status(500).json({ message: "Error fetching gigs" });
    }
});

/* --------------------------------------------
   PUBLIC → GET ONE GIG BY ID
----------------------------------------------- */
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

/* --------------------------------------------
   POST → EMPLOYER CREATES GIG
----------------------------------------------- */
router.post("/", verifyToken, async (req, res) => {
    try {
        const { title, description, skill, location, offeredRate } = req.body;

        if (req.user.role !== "employer") {
            return res.status(403).json({ error: "Only employers can post gigs" });
        }

        const fairRate = getFairWage(location, skill);
        if (!fairRate) {
            return res.status(400).json({ error: "Invalid location or skill" });
        }

        const gig = new Gig({
            employer: req.user.id,
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
        console.error("🔥 Error creating gig:", err);
        res.status(500).json({ error: err.message });
    }
});

/* --------------------------------------------
   WORKER → APPLY TO A GIG
----------------------------------------------- */
router.post("/:id/apply", verifyToken, async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        if (!gig) return res.status(404).json({ error: "Gig not found" });

        if (req.user.role !== "worker") {
            return res.status(403).json({ error: "Only workers can apply" });
        }

        // Check if already applied
        const existingApp = await Application.findOne({
            gig: gig._id,
            worker: req.user.id,
        });

        if (existingApp) return res.status(400).json({ error: "Already applied" });

        // Create new Application
        const application = new Application({
            gig: gig._id,
            worker: req.user.id,
        });

        await application.save();

        res.status(201).json({ message: "Applied successfully!", application });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

/* --------------------------------------------
   EMPLOYER → VIEW APPLICANTS
----------------------------------------------- */

// GET applicants for a gig
router.get('/:gigId/applicants', verifyToken, async (req, res) => {
    try {
        const applications = await Application.find({ gig: req.params.gigId })
            .populate('worker', 'name phone skills expectedRate location')
            .lean();

        res.json(applications); // each item now has _id and worker info
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching applicants' });
    }
});




/* --------------------------------------------
   EMPLOYER → EDIT GIG
----------------------------------------------- */
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        if (!gig) return res.status(404).json({ error: "Gig not found" });

        if (gig.employer.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const updates = ["title", "description", "skill", "location", "offeredRate"];
        updates.forEach((key) => {
            if (req.body[key] !== undefined) gig[key] = req.body[key];
        });

        await gig.save();
        res.json(gig);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

/* --------------------------------------------
   EMPLOYER → DELETE GIG
----------------------------------------------- */
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        if (!gig) return res.status(404).json({ error: "Gig not found" });

        if (gig.employer.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await gig.deleteOne();
        res.json({ message: "Gig deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});


//employer-accept gig
router.post('/:gigId/applicants/:appId/accept', verifyToken, async (req, res) => {
    try {
        const app = await Application.findById(req.params.appId);
        if (!app) return res.status(404).json({ message: 'Application not found' });

        app.status = 'accepted';
        await app.save();
        res.json({ message: 'Applicant accepted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error accepting applicant' });
    }
});

//employer-reject gig
router.post('/:gigId/applicants/:appId/reject', verifyToken, async (req, res) => {
    try {
        const app = await Application.findById(req.params.appId);
        if (!app) return res.status(404).json({ message: 'Application not found' });

        app.status = 'rejected';
        await app.save();
        res.json({ message: 'Applicant rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error rejecting applicant' });
    }
});



export default router;
