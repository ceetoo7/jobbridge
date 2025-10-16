// server/routes/userRoutes.js
import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to protect routes (decode JWT and attach user)
const protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(404).json({ error: 'User not found' });
        }
        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(401).json({ error: 'Token invalid or expired' });
    }
};

// ✅ GET /api/users/me — get current user profile
router.get('/me', protect, async (req, res) => {
    try {
        res.json(req.user);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

// ✅ PUT /api/users/me — update current user profile
router.put('/me', protect, async (req, res) => {
    const { name, location, skills, expectedRate } = req.body;

    try {
        // Validate worker-specific fields if role is worker
        if (req.user.role === 'worker') {
            if (!location || !skills || expectedRate == null) {
                return res.status(400).json({ error: 'Worker must provide location, skills, and expectedRate' });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { name, location, skills, expectedRate },
            { new: true, runValidators: true, select: '-password' }
        );

        res.json(updatedUser);
    } catch (err) {
        console.error('Update error:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: Object.values(err.errors).map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ✅ GET /api/users/workers — public list of workers (for future use)
router.get('/workers', async (req, res) => {
    try {
        const workers = await User.find({ role: 'worker' }, 'name location skills expectedRate');
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;