import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
    uploadCV,
    uploadCVPDF,
    getCVProfile,
    deleteCV,
    suggestSkillsFromCV,
    getWorkerCVSummary
} from '../controllers/cvController.js';

const router = express.Router();

// Worker CV management
// Upload via text or JSON
router.post('/upload', verifyToken, uploadCV);

// Upload PDF file specifically
router.post('/upload/pdf', verifyToken, upload.single('cv'), uploadCVPDF);

// Get CV profile
router.get('/profile', verifyToken, getCVProfile);

// Delete CV
router.delete('/delete', verifyToken, deleteCV);

// Get skill suggestions from CV
router.get('/suggest-skills', verifyToken, suggestSkillsFromCV);

// Employer view worker CV summary
router.get('/worker/:workerId', verifyToken, getWorkerCVSummary);

export default router;
