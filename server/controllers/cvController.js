import fs from 'fs';
import User from '../models/User.js';
import { generateCVSummary, createTFIDFVector, calculateIDF, preprocessText } from '../utils/vectorMatcher.js';
import { extractTextFromPDF, isValidPDF, getPDFMetadata } from '../utils/pdfExtractor.js';


export const uploadCV = async (req, res) => {
    try {
        const userId = req.user.id;

        if (req.user.role !== 'worker') {
            return res.status(403).json({ error: 'Only workers can upload CVs' });
        }

        let cvText = '';
        let fileName = null;
        let fileSize = null;
        let pageCount = null;

        if (req.file) {
            // Validate PDF
            if (!isValidPDF(req.file)) {
                return res.status(400).json({ error: 'Invalid file. Only PDF files are allowed.' });
            }

            // Extract text from PDF
            try {
                cvText = await extractTextFromPDF(req.file.buffer);
                fileName = req.file.originalname;
                fileSize = req.file.size;

                // Get PDF metadata
                const metadata = await getPDFMetadata(req.file.buffer);
                pageCount = metadata?.pageCount || null;

                if (!cvText || cvText.trim().length === 0) {
                    return res.status(400).json({ error: 'Could not extract text from PDF. Please ensure the PDF contains text (not just images).' });
                }
            } catch (pdfError) {
                console.error('PDF extraction error:', pdfError);
                return res.status(400).json({ error: 'Failed to extract text from PDF. Please try pasting the text directly.' });
            }
        } else if (req.body.cvText) {
            // Direct text input
            cvText = req.body.cvText;
            fileName = req.body.fileName || null;
        } else {
            return res.status(400).json({ error: 'Please upload a PDF file or paste CV text' });
        }

        if (!cvText || cvText.trim().length === 0) {
            return res.status(400).json({ error: 'CV content is required' });
        }

        // Minimum content validation
        if (cvText.trim().length < 50) {
            return res.status(400).json({ error: 'CV content is too short. Please provide at least 50 characters.' });
        }

        // Preprocess the CV text
        const processedText = preprocessText(cvText);

        // Generate summary
        const cvSummary = generateCVSummary(cvText);

        // Create TF-IDF vector
        const words = processedText.split(/\s+/).filter(w => w.length > 2);
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        // Normalize frequencies
        const totalWords = words.length;
        const cvVector = new Map();
        Object.entries(wordFreq).forEach(([word, freq]) => {
            cvVector.set(word, freq / totalWords);
        });

        // Update user with CV data
        const user = await User.findByIdAndUpdate(
            userId,
            {
                cvText: cvText,
                cvUrl: fileName,
                cvVector: cvVector,
                cvSummary: cvSummary,
                cvUploadedAt: new Date(),
                cvFileInfo: {
                    originalName: fileName,
                    size: fileSize,
                    pageCount: pageCount,
                    uploadMethod: req.file ? 'pdf' : 'text'
                }
            },
            { new: true }
        );

        res.status(200).json({
            message: 'CV uploaded and processed successfully',
            uploadMethod: req.file ? 'pdf' : 'text',
            cvSummary: {
                wordCount: cvSummary.wordCount,
                detectedSkills: cvSummary.detectedSkills,
                experienceMentions: cvSummary.experienceMentions,
                hasContactInfo: cvSummary.hasContactInfo,
                hasPhone: cvSummary.hasPhone
            },
            fileInfo: req.file ? {
                name: fileName,
                size: `${(fileSize / 1024).toFixed(1)} KB`,
                pages: pageCount
            } : null,
            cvUploadedAt: user.cvUploadedAt
        });
    } catch (error) {
        console.error('Error uploading CV:', error);
        res.status(500).json({ error: 'Failed to process CV' });
    }
};

/**
 * Upload CV from PDF file only
 */
export const uploadCVPDF = async (req, res) => {
    try {
        const userId = req.user.id;

        if (req.user.role !== 'worker') {
            return res.status(403).json({ error: 'Only workers can upload CVs' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        // Validate PDF
        if (!isValidPDF(req.file)) {
            return res.status(400).json({ error: 'Invalid file. Only PDF files are allowed.' });
        }

        // Check file size (should be handled by multer but double-check)
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }

        // Read PDF from disk (multer saved it there)
        const fileBuffer = fs.readFileSync(req.file.path);

        // Extract text from PDF
        let cvText;
        try {
            cvText = await extractTextFromPDF(fileBuffer);
        } catch (pdfError) {
            console.error('PDF extraction error:', pdfError);
            return res.status(400).json({ error: 'Failed to extract text from PDF. The PDF might be scanned images or corrupted.' });
        }

        if (!cvText || cvText.trim().length === 0) {
            return res.status(400).json({ error: 'Could not extract text from PDF. Please ensure the PDF contains selectable text.' });
        }

        if (cvText.trim().length < 50) {
            return res.status(400).json({ error: 'Extracted text is too short. Please provide a more detailed CV.' });
        }

        // Get PDF metadata
        const metadata = await getPDFMetadata(fileBuffer);

        // Process CV
        const processedText = preprocessText(cvText);
        const cvSummary = generateCVSummary(cvText);

        // Create TF-IDF vector
        const words = processedText.split(/\s+/).filter(w => w.length > 2);
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        const totalWords = words.length;
        const cvVector = new Map();
        Object.entries(wordFreq).forEach(([word, freq]) => {
            cvVector.set(word, freq / totalWords);
        });

        // Update user - store file path so the PDF can be retrieved later
        const user = await User.findByIdAndUpdate(
            userId,
            {
                cvText: cvText,
                cvUrl: req.file.filename,
                cvVector: cvVector,
                cvSummary: cvSummary,
                cvUploadedAt: new Date(),
                cvFileInfo: {
                    originalName: req.file.originalname,
                    filename: req.file.filename,
                    size: req.file.size,
                    pageCount: metadata?.pageCount,
                    uploadMethod: 'pdf'
                }
            },
            { new: true }
        );

        res.status(200).json({
            message: 'PDF CV uploaded and processed successfully',
            uploadMethod: 'pdf',
            cvSummary: {
                wordCount: cvSummary.wordCount,
                detectedSkills: cvSummary.detectedSkills,
                experienceMentions: cvSummary.experienceMentions,
                hasContactInfo: cvSummary.hasContactInfo,
                hasPhone: cvSummary.hasPhone
            },
            fileInfo: {
                name: req.file.originalname,
                size: `${(req.file.size / 1024).toFixed(1)} KB`,
                pages: metadata?.pageCount
            },
            cvUploadedAt: user.cvUploadedAt
        });
    } catch (error) {
        console.error('Error uploading PDF CV:', error);
        res.status(500).json({ error: 'Failed to process PDF CV' });
    }
};

/**
 * Get CV profile for the logged-in worker
 */
export const getCVProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .select('cvUrl cvText cvSummary cvUploadedAt cvFileInfo skills expectedRate');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            hasCV: !!user.cvText,
            cvUrl: user.cvUrl,
            cvSummary: user.cvSummary,
            cvUploadedAt: user.cvUploadedAt,
            fileInfo: user.cvFileInfo,
            skills: user.skills,
            expectedRate: user.expectedRate
        });
    } catch (error) {
        console.error('Error fetching CV profile:', error);
        res.status(500).json({ error: 'Failed to fetch CV profile' });
    }
};

/**
 * Delete CV profile
 */
export const deleteCV = async (req, res) => {
    try {
        const userId = req.user.id;

        await User.findByIdAndUpdate(userId, {
            $unset: {
                cvText: 1,
                cvVector: 1,
                cvSummary: 1,
                cvUploadedAt: 1,
                cvFileInfo: 1
            },
            $set: { cvUrl: null }
        });

        res.status(200).json({ message: 'CV deleted successfully' });
    } catch (error) {
        console.error('Error deleting CV:', error);
        res.status(500).json({ error: 'Failed to delete CV' });
    }
};

/**
 * Update skills based on CV analysis
 * This allows the system to suggest skills extracted from CV
 */
export const suggestSkillsFromCV = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user || !user.cvText) {
            return res.status(404).json({ error: 'No CV found' });
        }

        const detectedSkills = user.cvSummary?.detectedSkills || [];

        // Suggest skills not already in user's profile
        const currentSkills = user.skills?.map(s => s.toLowerCase()) || [];
        const suggestions = detectedSkills.filter(
            skill => !currentSkills.includes(skill.toLowerCase())
        );

        res.status(200).json({
            currentSkills: user.skills,
            suggestedSkills: suggestions,
            message: suggestions.length > 0
                ? 'Found potential skills in your CV'
                : 'No new skills detected in your CV'
        });
    } catch (error) {
        console.error('Error suggesting skills:', error);
        res.status(500).json({ error: 'Failed to suggest skills' });
    }
};

/**
 * Admin/Employer: View worker CV summary (without full text)
 */
export const getWorkerCVSummary = async (req, res) => {
    try {
        const { workerId } = req.params;

        // Only employers or the worker themselves can view
        if (req.user.role !== 'employer' && req.user.id !== workerId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const worker = await User.findById(workerId)
            .select('name cvSummary skills ratingAverage ratingCount cvUploadedAt cvFileInfo');

        if (!worker) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        res.status(200).json({
            workerId: worker._id,
            name: worker.name,
            hasCV: !!worker.cvSummary?.wordCount,
            cvSummary: worker.cvSummary,
            fileInfo: worker.cvFileInfo,
            skills: worker.skills,
            rating: {
                average: worker.ratingAverage,
                count: worker.ratingCount
            }
        });
    } catch (error) {
        console.error('Error fetching worker CV:', error);
        res.status(500).json({ error: 'Failed to fetch worker CV' });
    }
};

export default {
    uploadCV,
    uploadCVPDF,
    getCVProfile,
    deleteCV,
    suggestSkillsFromCV,
    getWorkerCVSummary
};
