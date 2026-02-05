
import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireDirector } from '../middleware/auth.js';
import { upload } from '../lib/file_upload.js';
import { NotificationService } from '../services/NotificationService.js';
import { AuditService } from '../services/AuditService.js';

const router = express.Router();

// HELPER: Map Depts to School Codes (for redundancy check)
// This logic should ideally be in a service or config
const SCHOOL_MAP = {
    'STME': 'STME', // Engineering
    'SPTM': 'SPTM', // Pharmacy
    'SBM': 'SBM', // MBA
    'LAW': 'LAW', // Law
    'OFFICE': 'OFFICE' // Fallback
};

/**
 * POST /student/appeal
 * Submit a Condonation Request
 */
router.post('/student/appeal', authenticateToken, upload.single('proof'), async (req, res) => {
    try {
        const { sapid, student_id, dept } = req.user;
        const { type, description } = req.body;
        const file = req.file;

        if (!student_id || !dept) return res.status(403).json({ error: "Invalid User Context. Relogin." });

        // 1. Strict Eligibility Check (Can customize per school later)
        // For now, anyone below 75% is eligible? Or anyone can appeal?
        // User asked for "Low attendance" context. We allow all, but Director sees stats.

        if (!file) return res.status(400).json({ error: "Proof document is mandatory." });
        if (!process.env.BASE_URL && !req.protocol) console.warn("BASE_URL not set");

        const proof_url = `${req.protocol}://${req.get('host')}/uploads/proofs/${file.filename}`;

        // 2. Insert Appeal
        const result = await query(`
            INSERT INTO appeals (student_id, school_code, type, description, proof_url, status)
            VALUES ($1, $2, $3, $4, $5, 'Pending')
            RETURNING id, status
        `, [student_id, dept, type, description, proof_url]);

        // 3. Notify Director (Scoped by School)
        await NotificationService.notifyRole({
            role: 'director',
            filter: { dept }, // Only notify Directors of THIS department
            title: `New Appeal: ${type}`,
            message: `${sapid} submitted a request: ${description.substring(0, 50)}...`,
            link: '/director/appeals',
            type: 'warning'
        });

        res.json({ success: true, appeal_id: result.rows[0].id, message: "Appeal Submitted Successfully" });

    } catch (e) {
        console.error("Appeal Submit Error:", e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /director/appeals
 * List Pending Appeals (Scoped by School)
 */
router.get('/director/appeals', authenticateToken, requireDirector, async (req, res) => {
    try {
        const { dept } = req.user; // Director's Department IS their School Scope

        console.log(`[Appeals] Director ${req.user.sapid} fetching for School: ${dept}`);

        // Scoped Query
        const sql = `
            SELECT 
                a.id, a.type, a.description, a.status, a.answer_proof as proof_url_legacy, a.proof_url, a.created_at,
                s.name as student_name, s.sapid, s.program, s.year,
                (
                    SELECT round(avg(percent)) 
                    FROM (
                        SELECT (COUNT(CASE WHEN att.present THEN 1 END)::numeric / COUNT(*)) * 100 as percent
                        FROM sessions sess 
                        JOIN attendance att ON sess.session_id = att.session_id
                        WHERE att.student_id = s.student_id
                        GROUP BY sess.subject_id
                    ) as sub_stats
                ) as current_avg_attendance
            FROM appeals a
            JOIN students s ON a.student_id = s.student_id
            WHERE a.school_code = $1 
            ORDER BY a.created_at DESC
        `;

        // NOTE: Postgres doesn't allow subquery in select easily without group by if not careful, 
        // but here it's correlated subquery, so it works.

        const { rows } = await query(sql, [dept]);

        res.json({
            school: dept,
            appeals: rows
        });

    } catch (e) {
        console.error("Director Appeals Fetch Error:", e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /director/update-appeal
 * Approve or Reject
 */
router.post('/director/update-appeal', authenticateToken, requireDirector, async (req, res) => {
    try {
        const { appeal_id, status } = req.body; // 'Approved' or 'Rejected'
        const { dept } = req.user;

        if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ error: "Invalid status" });

        // 1. Verify Ownership (Security)
        const check = await query(`SELECT school_code, student_id, type FROM appeals WHERE id = $1`, [appeal_id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Appeal not found" });
        if (check.rows[0].school_code !== dept) return res.status(403).json({ error: "Access Denied: Wrong School" });

        const { student_id, type } = check.rows[0];

        // 2. Update
        await query(`UPDATE appeals SET status = $1 WHERE id = $2`, [status, appeal_id]);

        // 3. Notify Student
        await NotificationService.sendToStudent({
            studentId: student_id,
            title: `Appeal Update: ${type}`,
            message: `Your appeal has been ${status}. Check the dashboard for details.`,
            type: status === 'Approved' ? 'success' : 'error',
            link: '/student/appeal'
        });

        // 4. Audit Log
        await AuditService.log({
            action: 'APPEAL_UPDATE',
            entityId: appeal_id,
            entityType: 'appeal',
            actorId: req.user.student_id || req.user.sapid, // Director ID
            actorRole: 'director',
            changes: { status: { new: status } },
            metadata: { school: dept, type }
        });

        res.json({ success: true, message: `Appeal marked as ${status}` });

    } catch (e) {
        console.error("Appeal Update Error:", e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
