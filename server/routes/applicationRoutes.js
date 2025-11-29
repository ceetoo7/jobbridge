import express from 'express';
import Gig from '../models/Gig.js';
import Application from '../models/Application.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/applications — Apply to a gig
router.post('/', verifyToken, async (req, res) => {
    try {
        const { gigId } = req.body;
        const workerId = req.user._id;

        if (!gigId) {
            return res.status(400).json({ error: 'Gig ID is required' });
        }

        const gig = await Gig.findById(gigId);
        if (!gig) {
            return res.status(404).json({ error: 'Gig not found' });
        }

        // Prevent applying to own gig
        if (gig.employer.toString() === workerId.toString()) {
            return res.status(400).json({ error: 'You cannot apply to your own gig' });
        }

        const application = new Application({ gig: gigId, worker: workerId });
        await application.save();
        await application.populate('worker', 'name location');

        res.status(201).json(application);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'You have already applied to this gig' });
        }
        res.status(500).json({ error: 'Failed to apply' });
    }
});

// GET /api/gigs/:gigId/applicants — View applicants (employer only)
router.get('/gigs/:gigId/applicants', verifyToken, async (req, res) => {
    try {
        const { gigId } = req.params;
        const employerId = req.user._id;

        const gig = await Gig.findById(gigId);
        if (!gig || gig.employer.toString() !== employerId.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const applications = await Application.find({ gig: gigId })
            .populate('worker', 'name phone location skills')
            .sort({ createdAt: -1 });

        res.json(applications);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch applicants' });
    }
});

export default router;
