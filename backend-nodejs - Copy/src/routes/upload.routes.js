import express from 'express';
import { upload } from '../utils/fileUpload.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/document', protect, upload.single('document'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // Construct the URL. In production, this would be a full URL.
    // We'll use a relative path that the frontend can append to the base API URL.
    const fileUrl = `/uploads/documents/${req.file.filename}`;

    res.json({
        message: 'File uploaded successfully',
        fileUrl: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
    });
});

export default router;
