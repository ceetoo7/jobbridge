// server/models/Gig.js
import mongoose from 'mongoose';

const GigSchema = new mongoose.Schema({
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: String,
    skill: { type: String, required: true },
    location: { type: String, required: true },
    offeredRate: { type: Number, required: true },
    fairRate: Number,
    isExploitative: Boolean,
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // optional

}, { timestamps: true });

const Gig = mongoose.model('Gig', GigSchema);
export default Gig; // ✅