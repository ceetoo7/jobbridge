// server/routes/gigRoutes.js
import express from 'express';
import Gig from '../models/Gig.js';
import User from '../models/User.js';
import { getFairWage, isExploitative } from '../utils/fairWage.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { title, description, skill, location, offeredRate, employerId } = req.body;
        const fairRate = getFairWage(location, skill);
        if (!fairRate) return res.status(400).json({ error: 'Invalid location or skill' });

        const gig = new Gig({
            employer: employerId,
            title,
            description,
            skill,
            location,
            offeredRate: Number(offeredRate),
            fairRate,
            isExploitative: isExploitative(Number(offeredRate), fairRate)
        });
        await gig.save();
        await gig.populate('employer', 'name');
        res.status(201).json(gig);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const gigs = await Gig.find()
            .populate('employer', 'name location')
            .sort({ createdAt: -1 });
        res.json(gigs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;