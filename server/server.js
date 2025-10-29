import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import gigRoutes from './routes/gigRoutes.js';
import userRoutes from './routes/userRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import { protect } from './middleware/auth.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/gigs', gigRoutes);
app.use('/api/users', protect, userRoutes);

// Mount application routes (protected)
app.use('/api/applications', protect, applicationRoutes);
app.use('/api', protect, applicationRoutes); // enables /api/gigs/:id/applicants

app.get('/', (req, res) => {
    res.json({ message: 'JobBridge Nepal API - Running ✅' });
});

// ✅ Connect to MongoDB FIRST, then start server
const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1); // Exit if DB fails to connect
    });