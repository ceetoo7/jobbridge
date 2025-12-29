import mongoose from "mongoose";

const GigSchema = new mongoose.Schema(
    {
        employer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        location: {
            district: { type: String, required: true },
            area: { type: String, required: true },
        },

        skills: {
            type: [String],
            required: true,
        },

        offeredRate: {
            type: Number,
            required: true,
        },

        fairRate: Number,
        isExploitative: Boolean,

        applicants: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                status: {
                    type: String,
                    enum: ["pending", "accepted", "rejected"],
                    default: "pending",
                },
            },
        ],

        acceptedApplicants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("Gig", GigSchema);
