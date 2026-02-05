// backend/routes/event_routes.js
import express from 'express';
import { query } from '../db.js';
import { NotificationService } from '../services/NotificationService.js';

const router = express.Router();

/**
 * POST /events
 * Host a new event
 * Roles: event_coordinator, club_head, director, school_admin
 */
router.post('/', async (req, res) => {
    try {
        const { title, school, venue, description, date, start_time, end_time, budget_requested } = req.body;
        const sapid = req.user.sapid;

        // Legacy Validation & Conflict Detection (As per constraints)
        // 1. Basic Fields
        if (!title || !date || !start_time || !venue) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 2. Conflict Check (Simple overlap check)
        const overlap = await query(`
            SELECT event_id, title FROM events 
            WHERE date = $1 
            AND status = 'approved'
            AND venue = $2
            AND (
                (start_time <= $3 AND end_time > $3) OR
                (start_time < $4 AND end_time >= $4) OR
                (start_time >= $3 AND end_time <= $4)
            )
        `, [date, venue, start_time, end_time || start_time]); // simple fallback for end_time

        if (overlap.rows.length > 0) {
            return res.status(409).json({
                error: "Venue conflict detected",
                conflict: overlap.rows[0]
            });
        }

        // 3. Create Event
        const result = await query(`
            INSERT INTO events 
            (title, school, venue, description, date, start_time, end_time, budget_requested, created_by, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
            RETURNING event_id, title, status
        `, [title, school, venue, description, date, start_time, end_time, budget_requested || 0, sapid]);

        // 4. Audit Log (Initial Creation)
        // We could update the audit_log column immediately, or standard "created_at" is enough for creation.
        // Let's rely on created_at for creation event.

        // Notify Director
        await NotificationService.notifyRole({
            role: 'director',
            filter: { dept: school }, // Notify Director of the relevant school
            title: `New Event Request: ${title}`,
            message: `Event proposed by ${sapid} for ${date} at ${venue}. Budget: ${budget_requested}`,
            link: '/director/events/approvals',
            type: 'info'
        });

        res.status(201).json(result.rows[0]);

    } catch (e) {
        console.error("Create Event Error:", e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /events/my
 * Get events created by current user
 */
router.get('/my', async (req, res) => {
    try {
        const result = await query(`
            SELECT * FROM events 
            WHERE created_by = $1 
            ORDER BY date DESC
        `, [req.user.sapid]);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /events/pending
 * Get all pending events (For Director/AdminView)
 */
router.get('/pending', async (req, res) => {
    try {
        // Strict Role Check? Middleware usually handles it, but safety check:
        if (!['director', 'admin', 'school_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const result = await query(`
            SELECT * FROM events 
            WHERE status = 'pending' 
            ORDER BY date ASC
        `, []);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * PATCH /events/:id/status
 * Approve/Reject Event
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, feedback } = req.body; // status: 'approved' | 'rejected' | 'changes_requested'

        if (!['director', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // SAFETY: Fetch first
        const currentRes = await query("SELECT * FROM events WHERE event_id = $1", [req.params.id]);
        if (currentRes.rows.length === 0) return res.status(404).json({ error: "Event not found" });

        // Update with Audit Log
        const auditEntry = {
            action: status,
            by: req.user.sapid,
            at: new Date().toISOString(),
            feedback: feedback || null
        };

        const result = await query(`
            UPDATE events 
            SET 
                status = $1, 
                updated_at = CURRENT_TIMESTAMP,
                audit_log = audit_log || $2::jsonb
            WHERE event_id = $3
            RETURNING *
        `, [status, JSON.stringify([auditEntry]), req.params.id]);

        res.json(result.rows[0]);

    } catch (e) {
        console.error("Update Event Status Error:", e);
        res.status(500).json({ error: e.message });
    }
});


/**
 * GET /events/public
 * Get approved upcoming events (Public Access)
 */
router.get('/public', async (req, res) => {
    try {
        const result = await query(`
            SELECT event_id, title, description, date, start_time, school
            FROM events 
            WHERE status = 'approved' AND date >= CURRENT_DATE
            ORDER BY date ASC
            LIMIT 3
        `, []);
        res.json(result.rows);
    } catch (e) {
        console.error("Public Events Error:", e);
        // Fail gracefully for public view
        res.json([]);
    }
});

export default router;
