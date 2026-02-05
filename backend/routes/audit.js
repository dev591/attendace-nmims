import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireDirector } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /director/audit-logs
 * Fetch system audit trails
 * Query params: type (entity_type), actor (actor_id), limit
 */
router.get('/director/audit-logs', authenticateToken, requireDirector, async (req, res) => {
    try {
        const { type, limit } = req.query; // Simple filters for MVP

        let sql = `
            SELECT * FROM audit_logs 
            ORDER BY created_at DESC 
            LIMIT $1
        `;
        let params = [limit || 50];

        if (type) {
            sql = `
                SELECT * FROM audit_logs 
                WHERE entity_type = $1 
                ORDER BY created_at DESC 
                LIMIT $2
            `;
            params = [type, limit || 50];
        }

        const { rows } = await query(sql, params);
        res.json(rows);
    } catch (e) {
        console.error("Audit Fetch Error:", e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
