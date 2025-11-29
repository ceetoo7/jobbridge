import express from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// ✅ GET /api/users/me — get current user profile
// Use imported verifyToken middleware
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

// ✅ PUT /api/users/me — update current user profile
router.put('/me', verifyToken, async (req, res) => {
    const { name, location, skills, expectedRate } = req.body;

try {
    const updates = { name, location, skills, expectedRate };

    // Validate worker-specific fields
    if (req.user.role === 'worker') {
        if (!location || !skills || expectedRate == null) {
            return res.status(400).json({ error: 'Worker must provide location, skills, and expectedRate' });
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        updates,
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

// ✅ GET /api/users/workers — public list of workers
router.get('/workers', async (req, res) => {
    try {
        const workers = await User.find({ role: 'worker' }, 'name location skills expectedRate');
        res.json(workers);
    } catch (err) {
        console.error('Workers fetch error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
