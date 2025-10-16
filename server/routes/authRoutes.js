// server/routes/authRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

// Helper: process skills safely
const processSkills = (skills) => {
    if (Array.isArray(skills)) {
        return skills.filter(s => typeof s === 'string' && s.trim() !== '');
    } else if (typeof skills === 'string') {
        return skills.split(',').map(s => s.trim()).filter(s => s !== '');
    }
    return [];
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, phone, password, role = 'worker', location, skills, expectedRate } = req.body;

        // Validate common fields
        if (!name || !phone || !password || !location) {
            return res.status(400).json({ error: 'Name, phone, password, and location are required.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this phone number already exists.' });
        }

        // Role-specific validation
        let userData = {
            name: name.trim(),
            phone: phone.trim(),
            password,
            role,
            location: location.trim()
        };

        if (role === 'worker') {
            const processedSkills = processSkills(skills);
            if (processedSkills.length === 0 || expectedRate == null) {
                return res.status(400).json({ error: 'Worker must provide at least one skill and an expected rate.' });
            }
            userData.skills = processedSkills;
            userData.expectedRate = Number(expectedRate);
        }

        // Create user
        const user = new User(userData);
        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send response (exclude password)
        const userResponse = {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            location: user.location,
            ...(user.role === 'worker' && {
                skills: user.skills,
                expectedRate: user.expectedRate
            })
        };

        res.status(201).json({ user: userResponse, token });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Phone number already in use.' });
        }
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ error: 'Phone and password are required.' });
        }

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ error: 'Invalid phone or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid phone or password.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const userResponse = {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            location: user.location,
            ...(user.role === 'worker' && {
                skills: user.skills,
                expectedRate: user.expectedRate
            })
        };

        res.json({ user: userResponse, token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

export default router;