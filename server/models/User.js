import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['worker', 'employer'], default: 'worker' },
    location: {
        district: { type: String, required: true },
        area: { type: String },
    },
    skills: { type: [String], required: function () { return this.role === 'worker'; } },
    expectedRate: { type: Number },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // CV Upload and Vector Profile Fields
    cvUrl: { type: String, default: null },
    cvText: { type: String, default: null },
    cvVector: { type: Map, of: Number, default: null },
    cvSummary: {
        wordCount: { type: Number, default: 0 },
        detectedSkills: [{ type: String }],
        experienceMentions: [{ type: String }],
        hasContactInfo: { type: Boolean, default: false },
        hasPhone: { type: Boolean, default: false }
    },
    cvUploadedAt: { type: Date, default: null },
    cvFileInfo: {
        originalName: { type: String },
        filename: { type: String },
        size: { type: Number },
        pageCount: { type: Number },
        uploadMethod: { type: String, enum: ['pdf', 'text'] }
    }

}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model('User', UserSchema);
export default User;
