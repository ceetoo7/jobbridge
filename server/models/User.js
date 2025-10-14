const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['worker', 'employer', 'admin'], default: 'worker' },
    skills: { type: [String], default: [] }, // Only for workers
    expectedRate: { type: Number, default: 0 } // Only for workers
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
