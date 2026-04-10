import Gig from "../models/Gig.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import { getFairWage, isExploitative } from "../utils/fairWage.js";

// ================== gigs ================== 
// employer - get my gigs
export const getMyGigs = async (req, res) => {
    try {
        if (req.user.role !== "employer") {
            return res.status(403).json({ error: "Only employers can view their gigs" });
        }

        const gigs = await Gig.find({ employer: req.user.id });
        res.json(gigs);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// get all gigs
export const getAllGigs = async (req, res) => {
    try {
        const gigs = await Gig.find().populate("employer", "name");
        res.json(gigs);
    } catch {
        res.status(500).json({ message: "Error fetching gigs" });
    }
};

// get single gig
export const getGigById = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id).populate("employer", "name");
        if (!gig) return res.status(404).json({ message: "Gig not found" });

        let application = null;
        if (req.user.role === "worker") {
            application = await Application.findOne({
                gig: gig._id,
                worker: req.user.id,
            });
        }

        res.json({ ...gig.toObject(), application });
    } catch {
        res.status(500).json({ message: "Error fetching gig" });
    }
};

// create gig
export const createGig = async (req, res) => {
    try {
        if (req.user.role !== "employer") {
            return res.status(403).json({ error: "Only employers can post gigs" });
        }

        const { title, description, skills, location, offeredRate } = req.body;

        const fairRate = getFairWage(location, skills[0]);

        const gig = await Gig.create({
            employer: req.user.id,
            title,
            description,
            skills,
            skill: skills[0],
            location,
            offeredRate,
            fairRate,
            isExploitative: isExploitative(offeredRate, fairRate),
        });

        res.status(201).json(gig);
    } catch {
        res.status(500).json({ error: "Server error" });
    }
};

// edit gig
export const updateGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        if (!gig) return res.status(404).json({ error: "Gig not found" });

        if (gig.employer.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        Object.assign(gig, req.body);
        await gig.save();

        res.json(gig);
    } catch {
        res.status(500).json({ error: "Server error" });
    }
};

// delete gig
export const deleteGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        if (!gig) return res.status(404).json({ error: "Gig not found" });

        if (gig.employer.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await gig.deleteOne();
        res.json({ message: "Gig deleted" });
    } catch {
        res.status(500).json({ error: "Server error" });
    }
};

// ================== applications ================== 

export const applyToGig = async (req, res) => {
    try {
        const exists = await Application.findOne({
            gig: req.params.id,
            worker: req.user.id,
        });

        if (exists) return res.status(400).json({ error: "Already applied" });

        const application = await Application.create({
            gig: req.params.id,
            worker: req.user.id,
        });

        res.status(201).json(application);
    } catch {
        res.status(500).json({ error: "Server error" });
    }
};

export const getApplicants = async (req, res) => {
    try {
        const apps = await Application.find({ gig: req.params.gigId })
            .populate("worker", "name phone skills expectedRate location");

        res.json(apps);
    } catch {
        res.status(500).json({ message: "Server error" });
    }
};

export const acceptApplicant = async (req, res) => {
    const app = await Application.findById(req.params.appId);
    app.status = "accepted";
    await app.save();
    res.json({ message: "Applicant accepted" });
};

export const rejectApplicant = async (req, res) => {
    const app = await Application.findById(req.params.appId);
    app.status = "rejected";
    await app.save();
    res.json({ message: "Applicant rejected" });
};

export const completeGig = async (req, res) => {
    const app = await Application.findById(req.params.appId);
    app.status = "completed";
    await app.save();
    res.json({ message: "Marked completed" });
};

//================== ratings ================== 

export const rateWorker = async (req, res) => {
    const app = await Application.findById(req.params.applicationId);
    if (app.ratingWorker?.stars) {
        return res.status(400).json({ error: "Already rated" });
    }

    app.ratingWorker = req.body;
    await app.save();

    res.json(app.ratingWorker);
};

export const rateEmployer = async (req, res) => {
    const app = await Application.findById(req.params.applicationId);
    if (app.ratingEmployer?.stars) {
        return res.status(400).json({ error: "Already rated" });
    }

    app.ratingEmployer = req.body;
    await app.save();

    res.json(app.ratingEmployer);
};

// ================== worker history==================
export const workerHistory = async (req, res) => {
    try {
        if (req.user.id !== req.params.userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const apps = await Application.find({
            worker: req.params.userId,
            status: "completed",
        })
            .populate({
                path: "gig",
                select: "title offeredRate location",
                populate: { path: "employer", select: "name" },
            })
            .sort({ updatedAt: -1 });

        res.json(apps);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch job history" });
    }
};