import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const student_id = req.user.student_id;
        console.log(`[DEBUG] GET /notifications - User: ${req.user.sapid}, ID: ${student_id}, TokenPayload:`, req.user); // DEBUG LOG


        // Fetch last 20 notifications
        const { rows } = await query(
            `SELECT * FROM notifications 
             WHERE student_id = $1 
             ORDER BY created_at DESC 
             LIMIT 20`,
            [student_id]
        );

        // Count unread
        const countRes = await query(
            `SELECT COUNT(*) as unread_count FROM notifications 
             WHERE student_id = $1 AND is_read = FALSE`,
            [student_id]
        );

        res.json({
            notifications: rows,
            unread_count: parseInt(countRes.rows[0].unread_count)
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// PUT /notifications/:id/read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const student_id = req.user.student_id;

        await query(
            `UPDATE notifications SET is_read = TRUE 
             WHERE id = $1 AND student_id = $2`,
            [id, student_id]
        );
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update notification" });
    }
});

export default router;
