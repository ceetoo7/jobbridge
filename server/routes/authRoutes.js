// server/routes/authRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();


// ✅ Login route
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

        res.json({ user, token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});


// ✅ Register route
router.post('/register', async (req, res) => {
    try {
        const { name, phone, password, role = 'worker', location, skills, expectedRate } = req.body;

        // Validate required fields
        if (!name || !phone || !password) {
            return res.status(400).json({ error: 'Name, phone, and password are required.' });
        }

        // Handle skills: accept both string and array
        let processedSkills = [];
        if (Array.isArray(skills)) {
            processedSkills = skills.filter(s => typeof s === 'string' && s.trim() !== '');
        } else if (typeof skills === 'string') {
            processedSkills = skills.split(',').map(s => s.trim()).filter(s => s !== '');
        }
        // If neither, processedSkills remains empty array

        const userData = {
            name,
            phone,
            password,
            role
        };

        if (role === 'worker') {
            if (!location || processedSkills.length === 0 || expectedRate == null) {
                return res.status(400).json({ error: 'Worker must provide location, skills, and expected rate.' });
            }
            userData.location = location;
            userData.skills = processedSkills;
            userData.expectedRate = Number(expectedRate);
        }

        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this phone number already exists.' });
        }

        const user = new User(userData);
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ user, token });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(400).json({ error: err.message || 'Registration failed.' });
    }
});

export default router;