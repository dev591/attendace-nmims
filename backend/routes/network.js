
import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /network/search
 * Search students by Name or Skill
 * Query Params: ?q=React or ?q=Dev
 */
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        // Search logic:
        // 1. Match Name
        // 2. Match Skill (via join)
        // Return: name, sapid, avatar_seed (name), top 3 skills, verified score (calc on fly or simplified)

        const searchRes = await query(`
            SELECT 
                s.student_id, s.sapid, s.name, s.dept,
                COALESCE(
                    (SELECT json_agg(skill_name) 
                     FROM (SELECT skill_name FROM student_skills WHERE student_id = s.student_id LIMIT 3) t
                    ), '[]'
                ) as top_skills,
                (
                    100 + 
                    (SELECT COUNT(*) FROM student_skills WHERE student_id = s.student_id) * 5 +
                    (SELECT COALESCE(SUM(points),0) FROM achievements WHERE student_id = s.student_id AND status = 'Approved')
                ) as verified_score
            FROM students s
            LEFT JOIN student_skills ss ON s.student_id = ss.student_id
            WHERE 
                (s.name ILIKE $1 OR ss.skill_name ILIKE $1)
            GROUP BY s.student_id
            -- REMOVED STRICT VISIBILITY CHECK FOR DEBUGGING
            -- HAVING 
            --    (SELECT COUNT(*) FROM student_skills WHERE student_id = s.student_id) > 0 
            --    OR 
            --    (SELECT COALESCE(SUM(points),0) FROM achievements WHERE student_id = s.student_id AND status = 'Approved') > 0
            ORDER BY verified_score DESC
            LIMIT 20
        `, [`%${q}%`]);

        res.json(searchRes.rows);

    } catch (err) {
        console.error("Network Search Error", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /network/trending
 * Top students (by verified score) for the "Discover" feed
 */
router.get('/trending', authenticateToken, async (req, res) => {
    try {
        const trendingRes = await query(`
            SELECT 
                s.student_id, s.sapid, s.name, s.dept,
                COALESCE(
                    (SELECT json_agg(skill_name) 
                     FROM (SELECT skill_name FROM student_skills WHERE student_id = s.student_id LIMIT 3) t
                    ), '[]'
                ) as top_skills,
                (
                    100 + 
                    (SELECT COUNT(*) FROM student_skills WHERE student_id = s.student_id) * 5 +
                    (SELECT COALESCE(SUM(points),0) FROM achievements WHERE student_id = s.student_id AND status = 'Approved')
                ) as verified_score
            FROM students s
            GROUP BY s.student_id
            HAVING 
                (SELECT COUNT(*) FROM student_skills WHERE student_id = s.student_id) > 0 
                OR 
                (SELECT COALESCE(SUM(points),0) FROM achievements WHERE student_id = s.student_id AND status = 'Approved') > 0
            ORDER BY verified_score DESC
            LIMIT 10
        `);

        res.json(trendingRes.rows);
    } catch (err) {
        console.error("Trending Error", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /network/endorse
 * Endorse a peer's skill
 */
router.post('/endorse', authenticateToken, async (req, res) => {
    try {
        const { skill_id, to_student_id } = req.body;
        const from_student_id = req.user.student_id;

        if (from_student_id == to_student_id) return res.status(400).json({ error: "Cannot endorse yourself" });

        await query(
            `INSERT INTO endorsements (skill_id, from_student_id, to_student_id) VALUES ($1, $2, $3)
             ON CONFLICT (skill_id, from_student_id) DO NOTHING`,
            [skill_id, from_student_id, to_student_id]
        );

        res.json({ success: true, message: "Skill endorsed!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /network/collab
 * Send a collaboration request
 */
router.post('/collab', authenticateToken, async (req, res) => {
    try {
        const { to_student_id, project_idea } = req.body;
        const from_student_id = req.user.student_id;

        const { rows } = await query(
            `INSERT INTO collab_requests (from_student_id, to_student_id, project_idea) VALUES ($1, $2, $3) RETURNING id`,
            [from_student_id, to_student_id, project_idea]
        );

        // TRIGGER NOTIFICATION
        // We need the recipient's SAPID or we store student_id in notifications?
        // The table schema uses student_id (which might be the internal ID or SAPID).
        // Let's check `students` table usage. `req.user.student_id` is the internal ID.
        // So `to_student_id` is also internal ID.

        // Fetch sender name for the message
        const senderRes = await query(`SELECT name FROM students WHERE student_id = $1`, [from_student_id]);
        const senderName = senderRes.rows[0]?.name || "A student";

        await query(
            `INSERT INTO notifications (student_id, type, title, message, action_url) 
             VALUES ($1, 'COLLAB_REQUEST', $2, $3, $4)`,
            [
                to_student_id,
                'New Collaboration Request',
                `${senderName} wants to collaborate: "${project_idea}"`,
                `/network/requests` // or similar
            ]
        );

        res.json({ success: true, message: "Collab request sent!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
