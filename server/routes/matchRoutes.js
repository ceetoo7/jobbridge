// server/routes/matchRoutes.js
import express from "express";
import { protect } from "../middleware/auth.js"; // your auth middleware
import { getMatchedGigs } from "../controllers/matchController.js";

const router = express.Router();

// GET /api/match/gigs
router.get("/gigs", protect, getMatchedGigs);

export default router;
