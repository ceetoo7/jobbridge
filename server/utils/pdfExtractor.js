import { PDFParse } from 'pdf-parse';

/**
 * Extract text from PDF buffer using pdf-parse v2
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
export const extractTextFromPDF = async (pdfBuffer) => {
    try {
        const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
        const textResult = await parser.getText();
        await parser.destroy();
        return textResult.text.trim();
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
};

/**
 * Validate PDF file
 * @param {Object} file - Multer file object
 * @returns {boolean} - True if valid PDF
 */
export const isValidPDF = (file) => {
    if (!file) return false;
    const allowedTypes = ['application/pdf'];
    const allowedExtensions = ['.pdf'];

    const hasValidType = allowedTypes.includes(file.mimetype);
    const hasValidExt = allowedExtensions.some(ext =>
        file.originalname.toLowerCase().endsWith(ext)
    );

    return hasValidType && hasValidExt;
};

/**
 * Get PDF metadata using pdf-parse v2
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} - PDF metadata
 */
export const getPDFMetadata = async (pdfBuffer) => {
    try {
        const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
        const infoResult = await parser.getInfo();
        const textResult = await parser.getText();
        await parser.destroy();
        return {
            pageCount: textResult.total,
            info: infoResult
        };
    } catch (error) {
        console.error('Error getting PDF metadata:', error);
        return null;
    }
};

export default {
    extractTextFromPDF,
    isValidPDF,
    getPDFMetadata
};