
import express from 'express';
import { query } from '../db.js'; // Assuming shared DB module
const router = express.Router();

/**
 * MIDDLEWARE: Verify Admin or Director Role
 */
const verifyAdmin = (req, res, next) => {
    // req.user is populated by 'auth' middleware mounted in index.js
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'director')) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

/**
 * POST /extra-class
 * Adds a one-off session
 */
router.post('/extra-class', verifyAdmin, async (req, res) => {
    try {
        const { subject_code, date, start_time, end_time, venue, faculty } = req.body;

        if (!subject_code || !date || !start_time || !end_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate ID
        const timeClean = start_time.replace(/:/g, '');
        const sessionId = `EXTRA_${date}_${timeClean}_${subject_code}`;

        // Verify Subject Exists (to link correctly)
        // We need the Subject Code to exist in subjects table
        const subCheck = await query('SELECT subject_id, code FROM subjects WHERE code = $1', [subject_code]);
        if (subCheck.rows.length === 0) {
            return res.status(400).json({ error: `Subject Code '${subject_code}' not found in system` });
        }

        await query(`
            INSERT INTO sessions (
                session_id, subject_id, date, start_time, end_time, location, status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
            ON CONFLICT (session_id) DO UPDATE SET
                location = EXCLUDED.location,
                start_time = EXCLUDED.start_time,
                end_time = EXCLUDED.end_time,
                status = 'scheduled' -- Re-activate if was cancelled
        `, [sessionId, subject_code, date, start_time, end_time, venue || 'TBD']);

        res.json({ success: true, message: 'Extra class scheduled successfully', session_id: sessionId });

    } catch (e) {
        console.error("Add Extra Class Error", e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * DELETE /session/:id (Cancel Class)
 * soft-delete or updates status to 'cancelled'
 */
router.delete('/session/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // We use STATUS 'cancelled' so we track it was supposed to happen
        await query(`
            UPDATE sessions 
            SET status = 'cancelled' 
            WHERE session_id = $1
        `, [id]);

        res.json({ success: true, message: 'Session cancelled' });

    } catch (e) {
        console.error("Cancel Session Error", e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
