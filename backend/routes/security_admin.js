import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { NotificationService } from '../services/NotificationService.js';
import { AuditService } from '../services/AuditService.js';

const router = express.Router();

// Middleware to check if user is Security Head or Admin
const requireSecurityRole = async (req, res, next) => {
    // For MVP, we allow special SAPID '999999999' or role='security'
    // Or we can just allow anyone for DEMO purposes if user asks?
    // User said "SPECIAL SAP ID FOR SECURITY HEAD". Let's assume it's set in user.role or we check specific ID.
    // For now, let's hardcode a check or allow 'admin'/'director'.
    if (req.user.role === 'admin' || req.user.role === 'director' || req.user.role === 'security' || req.user.sapid === '999999999') {
        next();
    } else {
        res.status(403).json({ error: "Access Denied: Security Clearance Required" });
    }
};

/**
 * GET /security/lost-found/pending
 */
router.get('/lost-found/pending', authenticateToken, requireSecurityRole, async (req, res) => {
    try {
        const result = await query(`
            SELECT l.*, s.name as reporter_name, s.sapid
            FROM lost_items l
            JOIN students s ON l.student_id = s.student_id
            WHERE l.status = 'pending'
            ORDER BY l.created_at ASC
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /security/lost-found/review
 * Body: { id, status, security_note }
 */
router.post('/lost-found/review', authenticateToken, requireSecurityRole, async (req, res) => {
    try {
        const { id, status, security_note } = req.body;
        if (!['approved', 'rejected', 'resolved'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        // Fetch student_id to notify
        const itemRes = await query("SELECT student_id, description FROM lost_items WHERE id = $1", [id]);
        if (itemRes.rows.length > 0) {
            const { student_id, description } = itemRes.rows[0];

            await query(`
                UPDATE lost_items 
                SET status = $1, security_note = $2 
                WHERE id = $3
            `, [status, security_note, id]);

            // Notify Student
            await NotificationService.sendToStudent({
                studentId: student_id,
                title: `Lost & Found Update`,
                message: `Your report for "${description}" has been ${status}. ${security_note ? 'Note: ' + security_note : ''}`,
                type: status === 'approved' ? 'success' : (status === 'resolved' ? 'success' : 'error'),
                link: '/student/lost-found'
            });

            // Audit
            await AuditService.log({
                action: 'LOST_ITEM_REVIEW',
                entityId: id,
                entityType: 'lost_item',
                actorId: req.user.sapid,
                actorRole: 'security',
                changes: { status: { new: status } },
                metadata: { security_note }
            });
        }

        res.json({ message: "Item updated" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
