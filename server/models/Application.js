import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema(
    {
        gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
        worker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["pending", "accepted", "rejected", "completed"], default: "pending" },
        ratingWorker: {
            stars: { type: Number },
            review: { type: String, default: "" },
        },
        ratingEmployer: {
            stars: { type: Number },
            review: { type: String, default: "" },
        },
    },
    { timestamps: true }
);

export default mongoose.model("Application", ApplicationSchema);
