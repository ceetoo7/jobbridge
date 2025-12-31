import express from "express";
import Gig from "../models/Gig.js";
import User from "../models/User.js";
import { getFairWage, isExploitative } from "../utils/fairWage.js";
import { verifyToken } from "../middleware/auth.js";
import Application from '../models/Application.js';

const router = express.Router();

// employer - get all my gigs
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


// get all gigs
router.get("/", async (req, res) => {
    try {
        const gigs = await Gig.find().populate("employer", "name");
        res.status(200).json(gigs);
    } catch (error) {
        console.error("Error fetching gigs:", error);
        res.status(500).json({ message: "Error fetching gigs" });
    }
});



// get one gig by id
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id).populate("employer", "name");
        if (!gig) return res.status(404).json({ message: "Gig not found" });

        // include application for the logged-in worker if exists
        let application = null;
        if (req.user.role === "worker") {
            application = await Application.findOne({
                gig: gig._id,
                worker: req.user.id,
            });
        }

        res.status(200).json({
            ...gig.toObject(),
            application, // this will be null if not applied
        });
    } catch (error) {
        console.error("Error fetching gig:", error);
        res.status(500).json({ message: "Error fetching gig" });
    }
});


// employer creates a gig
router.post("/", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "employer") {
            return res.status(403).json({ error: "Only employers can post gigs" });
        }

        const { title, description, skills, location, offeredRate } = req.body;

        // Validate payload
        if (
            !title ||
            !description ||
            !Array.isArray(skills) || skills.length === 0 ||
            !location?.district || !location?.area ||
            !offeredRate
        ) {
            return res.status(400).json({ error: "Invalid location or skills" });
        }

        // Fair rate & exploitative
        const fairRate = getFairWage(location, skills[0]);
        const exploitative = isExploitative(offeredRate, fairRate);

        const gig = await Gig.create({
            employer: req.user.id,
            title,
            description,
            skills, // array of strings
            location: {
                district: location.district,
                area: location.area
            },
            offeredRate: Number(offeredRate),
            fairRate,
            isExploitative: exploitative
        });

        res.status(201).json(gig);

    } catch (err) {
        console.error("🔥 Error creating gig:", err);
        res.status(500).json({ error: "Server error" });
    }
});



// worker - apply to a gig
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



// employer view applicants
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



// employer - edit gig
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



// employer - delete gig
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

// APPLY FOR GIG
router.post("/:gigId/apply", verifyToken, async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.gigId);
        if (!gig) return res.status(404).json({ error: "Gig not found" });

        const alreadyApplied = await Application.findOne({
            gig: gig._id,
            worker: req.user.id,
        });
        if (alreadyApplied)
            return res.status(400).json({ error: "Already applied" });

        const application = new Application({
            gig: gig._id,
            worker: req.user.id,
            status: "pending",
        });
        await application.save();

        gig.applications.push(application._id);
        await gig.save();

        res.status(201).json({ message: "Applied successfully", application });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// EMPLOYER MARK COMPLETED
router.post("/:gigId/applicants/:appId/complete", verifyToken, async (req, res) => {
    try {
        const application = await Application.findById(req.params.appId);
        if (!application) return res.status(404).json({ error: "Application not found" });

        application.status = "completed";
        await application.save();

        res.json({ message: "Marked completed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// WORKER RATES EMPLOYER (ONCE ONLY)
router.post(
    "/:gigId/applicants/:applicationId/rate-employer",
    verifyToken,
    async (req, res) => {
        const { stars, review } = req.body;

        if (req.user.role !== "worker") {
            return res.status(403).json({ error: "Only workers can rate employers" });
        }

        if (!stars || stars < 1 || stars > 5) {
            return res.status(400).json({ error: "Stars must be 1–5" });
        }

        const application = await Application.findById(req.params.applicationId);
        if (!application) return res.status(404).json({ error: "Application not found" });

        if (application.ratingEmployer?.stars) {
            return res.status(400).json({ error: "Employer already rated" });
        }

        application.ratingEmployer = { stars, review };
        await application.save();

        res.json({ message: "Employer rated", rating: application.ratingEmployer });
    }
);

// EMPLOYER RATES WORKER (ONCE ONLY)
router.post(
    "/:gigId/applicants/:applicationId/rate-worker",
    verifyToken,
    async (req, res) => {
        const { stars, review } = req.body;

        if (req.user.role !== "employer") {
            return res.status(403).json({ error: "Only employers can rate workers" });
        }

        if (!stars || stars < 1 || stars > 5) {
            return res.status(400).json({ error: "Stars must be 1–5" });
        }

        const application = await Application.findById(req.params.applicationId);
        if (!application) return res.status(404).json({ error: "Application not found" });

        if (application.ratingWorker?.stars) {
            return res.status(400).json({ error: "Worker already rated" });
        }

        application.ratingWorker = { stars, review };
        await application.save();

        res.json({ message: "Worker rated", rating: application.ratingWorker });
    }
);


router.get("/users/:userId/applications", async (req, res) => {
    const { userId } = req.params;

    try {
        const applications = await Application.find({
            $or: [{ worker: userId }, { gigOwner: userId }],
        });

        res.json(applications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
});

// GET GIG WITH APPLICATIONS
router.get("/:gigId", verifyToken, async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.gigId)
            .populate("applications")
            .populate({ path: "applications", populate: "worker" })
            .populate("employer");
        if (!gig) return res.status(404).json({ error: "Gig not found" });

        res.json(gig);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});






export default router;
