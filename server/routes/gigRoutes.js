import express from "express";
import { verifyToken } from "../middleware/auth.js";
import * as gig from "../controllers/gigController.js";

const router = express.Router();

router.get("/", gig.getAllGigs);
router.get("/mine", verifyToken, gig.getMyGigs);
router.get("/:id", verifyToken, gig.getGigById);

router.post("/", verifyToken, gig.createGig);
router.put("/:id", verifyToken, gig.updateGig);
router.delete("/:id", verifyToken, gig.deleteGig);

router.post("/:id/apply", verifyToken, gig.applyToGig);
router.get("/:gigId/applicants", verifyToken, gig.getApplicants);
router.post("/:gigId/applicants/:appId/accept", verifyToken, gig.acceptApplicant);
router.post("/:gigId/applicants/:appId/reject", verifyToken, gig.rejectApplicant);
router.post("/:gigId/applicants/:appId/complete", verifyToken, gig.completeGig);

router.post("/:gigId/applicants/:applicationId/rate-worker", verifyToken, gig.rateWorker);
router.post("/:gigId/applicants/:applicationId/rate-employer", verifyToken, gig.rateEmployer);

router.get(
    "/applications/completed/worker/:userId",
    verifyToken,
    gig.workerHistory
);

export default router;
