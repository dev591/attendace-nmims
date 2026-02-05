
// Add this to the existing router in faculty_profile_routes.js or create new block
// Since multi-replace on strict mode is risky, I'll append to the file via overwrite.
// Wait, I should just modify `faculty_profile_routes.js` to include the list endpoint.

import express from 'express';
import { query } from '../db.js';
import { requireDirector, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /director/faculty/list
// Returns simple list of all faculty for valid directory display
router.get('/director/faculty/list', authenticateToken, requireDirector, async (req, res) => {
    try {
        const sql = `
            SELECT student_id, sapid, name, email, phone, dept, designation 
            FROM students 
            WHERE role = 'faculty'
            ORDER BY name ASC
        `;
        const { rows } = await query(sql);
        res.json(rows);
    } catch (err) {
        console.error("Faculty List Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /director/faculty/:id/profile
router.get('/director/faculty/:id/profile', authenticateToken, requireDirector, async (req, res) => {
    try {
        const { id } = req.params;
        const pRes = await query(`
            SELECT student_id, sapid, name, email, phone, dept, designation 
            FROM students 
            WHERE (sapid = $1 OR student_id = $1) AND role = 'faculty'
        `, [id]);

        if (pRes.rows.length === 0) return res.status(404).json({ error: "Faculty not found" });
        const profile = pRes.rows[0];

        const scheduleRes = await query(`
            SELECT 
                s.session_id,
                s.start_time,
                s.end_time,
                s.location,
                s.status,
                sub.name as subject_name,
                sub.code as subject_code
            FROM sessions s
            JOIN subjects sub ON s.subject_id = sub.subject_id
            JOIN course_subjects cs ON s.subject_id = cs.subject_id
            WHERE cs.faculty_name = $1
            AND s.date = CURRENT_DATE
            ORDER BY s.start_time ASC
        `, [profile.name]);

        const todaySchedule = scheduleRes.rows;

        let liveStatus = { state: 'FREE', details: null };
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0];

        for (const session of todaySchedule) {
            if (currentTime >= session.start_time && currentTime <= session.end_time) {
                liveStatus = {
                    state: 'BUSY',
                    details: `Teaching ${session.subject_name} in ${session.location || 'Unknown Room'}`
                };
                break;
            }
        }

        const statsRes = await query(`
            SELECT 
                COUNT(*) as scheduled,
                COUNT(CASE WHEN s.status = 'conducted' THEN 1 END) as conducted
            FROM sessions s
            JOIN course_subjects cs ON s.subject_id = cs.subject_id
            WHERE cs.faculty_name = $1
            AND s.date > CURRENT_DATE - INTERVAL '30 days'
            AND s.date <= CURRENT_DATE
        `, [profile.name]);

        const stats = statsRes.rows[0];
        const adherence = stats.scheduled > 0
            ? Math.round((stats.conducted / stats.scheduled) * 100)
            : 100;

        res.json({
            profile,
            liveStatus,
            todaySchedule,
            stats: {
                adherence_pct: adherence,
                monthly_classes: parseInt(stats.conducted)
            }
        });

    } catch (err) {
        console.error("Faculty Profile Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
