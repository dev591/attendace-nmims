
import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireDirector } from '../middleware/auth.js'; // Assuming these exist
import { upload } from '../lib/file_upload.js';
import fs from 'fs';
import path from 'path';
import { AuditService } from '../services/AuditService.js';

const router = express.Router();

// 1. Student: Upload Achievement
router.post('/student/achievement', authenticateToken, upload.single('certificate'), async (req, res) => {
    try {
        const { title, provider, type, date_completed } = req.body;
        const student_id = req.user.student_id;

        if (!req.file) return res.status(400).json({ error: "Certificate file is required" });

        const proof_url = `${process.env.BASE_URL || 'http://localhost:4000'}/uploads/achievements/${req.file.filename}`;

        await query(`
            INSERT INTO achievements (student_id, title, provider, type, date_completed, proof_url, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
        `, [student_id, title, provider, type, date_completed, proof_url]);

        res.json({ success: true, message: "Achievement submitted for verification!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// 2. Student: List My Achievements
router.get('/student/achievements', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT * FROM achievements WHERE student_id = $1 ORDER BY created_at DESC
        `, [req.user.student_id]);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Director: Pending Achievements (Scoped by School)
router.get('/director/achievements/pending', authenticateToken, requireDirector, async (req, res) => {
    try {
        const directorSchool = req.user.dept; // e.g., 'STME'

        // Join with students to filter by dept
        const result = await query(`
            SELECT a.*, s.name as student_name, s.sapid, s.program 
            FROM achievements a
            JOIN students s ON a.student_id = s.student_id
            WHERE a.status = 'Pending' AND s.dept = $1
            ORDER BY a.created_at ASC
        `, [directorSchool]);

        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Director: Verify Achievement
router.post('/director/achievement/verify', authenticateToken, requireDirector, async (req, res) => {
    try {
        const { id, decision } = req.body; // 'Approved' or 'Rejected'
        const directorSchool = req.user.dept;

        // Security Check: Ensure achievement belongs to student in same school
        const check = await query(`
             SELECT a.id FROM achievements a
             JOIN students s ON a.student_id = s.student_id
             WHERE a.id = $1 AND s.dept = $2
        `, [id, directorSchool]);

        if (check.rows.length === 0) {
            return res.status(403).json({ error: "Unauthorized access to this achievement" });
        }

        const points = decision === 'Approved' ? 10 : 0;

        await query(`
            UPDATE achievements 
            SET status = $1, points = $2 
            WHERE id = $3
        `, [decision, points, id]);

        // Audit Log
        await AuditService.log({
            action: 'ACHIEVEMENT_VERIFY',
            entityId: id,
            entityType: 'achievement',
            actorId: req.user.student_id || req.user.sapid,
            actorRole: 'director',
            changes: { status: { new: decision }, points: { new: points } },
            metadata: { school: directorSchool }
        });

        res.json({ success: true, points_awarded: points });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 5. Leaderboard (Gamification)
router.get('/gamification/leaderboard', async (req, res) => {
    try {
        const result = await query(`
            SELECT s.name, s.sapid, s.dept, SUM(a.points) as score
            FROM achievements a
            JOIN students s ON a.student_id = s.student_id
            WHERE a.status = 'Approved'
            GROUP BY s.student_id
            ORDER BY score DESC
            LIMIT 10
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
