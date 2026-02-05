
import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /social/feed
 * Aggregated feed of user posts + achievements
 */
router.get('/feed', authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.student_id;

        // Fetch posts and enrich with author info & like status
        const postsRes = await query(`
            SELECT 
                p.post_id, p.content, p.image_url, p.likes_count, p.created_at,
                s.name as author_name, s.sapid as author_sapid, s.dept as author_dept,
                (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.post_id AND l.student_id = $1) > 0 as is_liked
            FROM posts p
            JOIN students s ON p.student_id = s.student_id
            ORDER BY p.created_at DESC
            LIMIT 50
        `, [studentId]);

        res.json(postsRes.rows);
    } catch (err) {
        console.error("Feed Error", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /social/post
 * Create a new post
 */
router.post('/post', authenticateToken, async (req, res) => {
    try {
        const { content, image_url } = req.body;
        const studentId = req.user.student_id;

        if (!content && !image_url) {
            return res.status(400).json({ error: "Content or Image required" });
        }

        const result = await query(
            `INSERT INTO posts (student_id, content, image_url) VALUES ($1, $2, $3) RETURNING *`,
            [studentId, content, image_url]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Create Post Error", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /social/like
 * Toggle like on a post
 */
router.post('/like', authenticateToken, async (req, res) => {
    try {
        const { post_id } = req.body;
        const studentId = req.user.student_id;

        // Check availability
        const check = await query(`SELECT id FROM likes WHERE post_id = $1 AND student_id = $2`, [post_id, studentId]);

        if (check.rows.length > 0) {
            // Un-like
            await query(`DELETE FROM likes WHERE post_id = $1 AND student_id = $2`, [post_id, studentId]);
            await query(`UPDATE posts SET likes_count = likes_count - 1 WHERE post_id = $1`, [post_id]);
            res.json({ liked: false });
        } else {
            // Like
            await query(`INSERT INTO likes (post_id, student_id) VALUES ($1, $2)`, [post_id, studentId]);
            await query(`UPDATE posts SET likes_count = likes_count + 1 WHERE post_id = $1`, [post_id]);
            res.json({ liked: true });
        }
    } catch (err) {
        console.error("Like Error", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /social/chat/:friendId
 * Get chat history with a specific student
 */
router.get('/chat/:friendId', authenticateToken, async (req, res) => {
    try {
        const myId = req.user.student_id;
        const friendId = req.params.friendId; // Internal ID

        // Validate friend exists
        // const friendCheck = await query(`SELECT student_id FROM students WHERE student_id = $1`, [friendId]);
        // if (friendCheck.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const messages = await query(`
            SELECT * FROM messages 
            WHERE (sender_id = $1 AND receiver_id = $2) 
               OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
            LIMIT 100
        `, [myId, friendId]);

        res.json(messages.rows);
    } catch (err) {
        console.error("Chat History Error", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
