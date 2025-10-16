// server/routes/userRoutes.js
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.get('/workers', async (req, res) => {
    try {
        const workers = await User.find({ role: 'worker' }, 'name location skills expectedRate');
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;