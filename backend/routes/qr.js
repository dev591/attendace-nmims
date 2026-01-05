/* ADDED BY ANTI-GRAVITY */
import express from 'express';
import { getClient, query } from '../db.js';
import { recomputeAnalyticsForStudent } from '../lib/analytics.js';

const router = express.Router();

/**
 * POST /sessions/:session_id/generate-qr
 * Dev demo: returns a static token for the session.
 */
router.post('/sessions/:session_id/generate-qr', (req, res) => {
    const { session_id } = req.params;
    // In real app, sign this with JWT and expiry
    const token = `QR_${session_id}_${Date.now()}`;
    return res.json({ ok: true, session_id, qr_token: token });
});

/**
 * POST /sessions/:session_id/mark-attendance
 * Body: { sapid, qr_token }
 */
router.post('/sessions/:session_id/mark-attendance', async (req, res) => {
    const { session_id } = req.params;
    const { sapid, qr_token } = req.body;

    if (!qr_token || !qr_token.includes(session_id)) {
        return res.status(400).json({ error: 'Invalid QR Token' });
    }

    const client = await getClient();
    try {
        const sRes = await client.query('SELECT student_id FROM students WHERE sapid = $1', [sapid]);
        if (sRes.rowCount === 0) return res.status(404).json({ error: 'Student not found' });
        const student_id = sRes.rows[0].student_id;

        await client.query(`
            INSERT INTO attendance (session_id, student_id, present, status)
            VALUES ($1, $2, true, 'Present')
            ON CONFLICT (session_id, student_id) DO UPDATE SET present = true, status = 'Present';
        `, [session_id, student_id]);

        // Recompute immediately for crisp UI update
        const stats = await recomputeAnalyticsForStudent(sapid);

        return res.json({ ok: true, message: 'Marked Present via QR', stats });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

export default router;
