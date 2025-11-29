import mongoose from "mongoose";

const GigSchema = new mongoose.Schema(
    {
        employer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: { type: String, required: true },
        description: { type: String },

        // FIXED: location should match what you're saving
        location: {
            district: { type: String, required: true },
            area: { type: String, required: true },
        },  


        // FIXED: skill (single), since you use req.body.skill when creating gigs
skills: [{ type: String, required: true }],

        offeredRate: { type: Number, required: true },

        fairRate: Number,
        isExploitative: Boolean,

        // applicant IDs
        applicants: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" }
            }
        ], acceptedApplicants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"

            }
        ],
    },
    { timestamps: true }
);

const Gig = mongoose.model("Gig", GigSchema);
export default Gig;
