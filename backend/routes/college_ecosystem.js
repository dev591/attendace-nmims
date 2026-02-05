import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../lib/file_upload.js'; // reused multer config

const router = express.Router();

/**
 * POST /college/lost-found/report
 * Body: { item_name, description, location_lost }
 * File: image (required)
 */
router.post('/lost-found/report', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { item_name, description, location_lost } = req.body;
        const student_id = req.user.student_id;

        // In a real app, we upload to S3/Cloudinary. Here we use local path or mock URL if local.
        // Assuming 'upload' middleware saves to 'uploads/' and puts filename in req.file
        const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;

        if (!image_url) return res.status(400).json({ error: "Image is required" });

        await query(`
            INSERT INTO lost_items (student_id, item_name, description, location_lost, image_url, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
        `, [student_id, item_name, description, location_lost, image_url]);

        res.json({ message: "Report submitted for security review." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /college/lost-found/feed
 * Public approved items
 */
router.get('/lost-found/feed', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT l.*, s.name as reporter_name, s.dept 
            FROM lost_items l
            JOIN students s ON l.student_id = s.student_id
            WHERE l.status = 'approved'
            ORDER BY l.created_at DESC
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /college/lost-found/my
 * User's reports
 */
router.get('/lost-found/my', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT * FROM lost_items 
            WHERE student_id = $1 
            ORDER BY created_at DESC
        `, [req.user.student_id]);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
