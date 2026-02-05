import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { NotificationService } from '../services/NotificationService.js';

const router = express.Router();

// GET /admin/incidents
router.get('/incidents', authenticateToken, async (req, res) => {
    try {
        const { status } = req.query;
        let q = `SELECT * FROM incidents`;
        const params = [];
        if (status && status !== 'All') {
            q += ` WHERE status = $1`;
            params.push(status);
        }
        q += ` ORDER BY created_at DESC`;

        const { rows } = await query(q, params);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch incidents" });
    }
});

// POST /admin/incidents
router.post('/incidents', authenticateToken, async (req, res) => {
    try {
        const { title, description, severity, status, assigned_to } = req.body;
        const reported_by = req.user.sapid;

        const { rows } = await query(
            `INSERT INTO incidents (title, description, severity, status, reported_by, assigned_to) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, description, severity || 'Low', status || 'Open', reported_by, assigned_to]
        );
        // Notify Admins & Directors

        await NotificationService.notifyRole({
            role: 'admin',
            title: `Security Alert: ${severity}`,
            message: `New Incident Reported: ${title}`,
            link: '/admin/security',
            type: 'error'
        });

        await NotificationService.notifyRole({
            role: 'director',
            title: `Security Alert: ${severity}`,
            message: `New Incident Reported: ${title}`,
            link: '/director/security',
            type: 'error'
        });

        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create incident" });
    }
});

// PUT /admin/incidents/:id
router.put('/incidents/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution_notes } = req.body;

        // Update status
        const { rows } = await query(
            `UPDATE incidents SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (rows.length === 0) return res.status(404).json({ error: "Incident not found" });

        // If Resolved, maybe log to Audit?
        if (status === 'Resolved') {
            await query(
                `INSERT INTO audit_logs (action, target, details, actor_id, ip_address) 
                 VALUES ($1, $2, $3, $4, $5)`,
                ['INCIDENT_RESOLVED', `Incident #${id}`, resolution_notes || 'Resolved via Dashboard', req.user.sapid, req.ip]
            );
        }

        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update incident" });
    }
});

export default router;
