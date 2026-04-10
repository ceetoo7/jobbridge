import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
    getMatchedGigs,
    getVectorMatches,
    getTraditionalMatches
} from "../controllers/matchController.js";

const router = express.Router();

// Get traditional matched gigs (worker profile -> gig skills)
router.get("/gigs", verifyToken, getMatchedGigs);

// Get vector-only matches (requires CV)
router.get("/gigs/vector", verifyToken, getVectorMatches);

// Explicit traditional route
router.get("/gigs/traditional", verifyToken, getTraditionalMatches);

export default router;
