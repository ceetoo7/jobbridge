import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
    getMatchedGigs,
    getVectorMatches,
    getTraditionalMatches
} from "../controllers/matchController.js";

const router = express.Router();

// Get hybrid matched gigs (vector + traditional)
router.get("/gigs", verifyToken, getMatchedGigs);

// Get vector-only matches (requires CV)
router.get("/gigs/vector", verifyToken, getVectorMatches);

// Get traditional skill-based matches only
router.get("/gigs/traditional", verifyToken, getTraditionalMatches);

export default router;
