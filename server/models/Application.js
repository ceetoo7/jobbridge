import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

// Prevent duplicate applications
ApplicationSchema.index({ gig: 1, worker: 1 }, { unique: true });

export default mongoose.model('Application', ApplicationSchema);
