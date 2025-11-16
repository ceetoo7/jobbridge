import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // switch to email as unique identifier
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['worker', 'employer'], default: 'worker' },
    location: {
        district: { type: String, required: true },
        area: { type: String },
    },
    skills: { type: [String], required: function () { return this.role === 'worker'; } },
    expectedRate: { type: Number }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model('User', UserSchema);
export default User;
