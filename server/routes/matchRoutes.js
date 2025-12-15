import express from "express";
import { verifyToken } from "../middleware/auth.js";
import User from "../models/User.js";
import Gig from "../models/Gig.js";

const router = express.Router();

// get gigs matched to logged-in worker
router.get("/gigs", verifyToken, async (req, res) => {
  try {
    console.log("🟣 MATCH ROUTE HIT");

    // get the authenticated user
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    console.log("✔ Authenticated User ID:", req.user.id);
    console.log("User skills:", user.skills);

    // get all gigs with employer name
    const gigs = await Gig.find().populate("employer", "name");
    console.log("Total gigs in DB:", gigs.length);

    // just send all gigs; matching will be done in utils/frontend
    res.status(200).json(gigs);

  } catch (err) {
    console.error("Matching error:", err);
    res.status(500).json({ message: "Failed to fetch matched gigs", err });
  }
});

export default router;
