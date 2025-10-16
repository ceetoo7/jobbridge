// server/server.js
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import gigRoutes from './routes/gigRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// ✅ Configure CORS to allow your frontend origin
const corsOptions = {
    origin: 'http://localhost:5173', // Vite's default port
    credentials: true, // if you use cookies (optional for JWT in localStorage)
};

app.use(cors(corsOptions)); // ← Apply the options
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'JobBridge Nepal API - Running ✅' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});