
import express from 'express';
import multer from 'multer';
import { processStudentUpload } from '../services/ingest_service.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware check (ensure admin) - simplified for MVP, add proper middleware later if unrelated to index.js structure
// Assuming app uses global middleware or this router is mounted behind auth

// 1. POST /admin/ingest/students
router.post('/ingest/students', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Admin ID from auth middleware (req.user)
        // If not present (dev mode?), fallback to 'ADMIN'
        const adminId = req.user?.sapid || 'ADMIN';

        console.log(`[Admin API] Received upload from ${adminId}`);

        const stats = await processStudentUpload(req.file.buffer, adminId);

        res.json({
            success: true,
            message: `Processed ${stats.total} rows. Inserted: ${stats.inserted}, Updated: ${stats.updated}`,
            stats
        });

    } catch (err) {
        console.error("Ingest API Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. GET /admin/ingest/logs
router.get('/ingest/logs', async (req, res) => {
    try {
        const { rows } = await import('../db.js').then(m => m.query(`
            SELECT * FROM upload_logs ORDER BY created_at DESC LIMIT 50
        `));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 3. POST /admin/ingest/ica-marks
router.post('/ingest/ica-marks', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const csvString = req.file.buffer.toString('utf-8');
        const { parse } = await import('csv-parse/sync');
        const records = parse(csvString, { columns: true, skip_empty_lines: true, trim: true });

        // Expected columns: sapid, subject_code, test_name, marks, total
        let inserted = 0;
        let updated = 0;

        const { query } = await import('../db.js');

        for (const row of records) {
            // resolving student_id from sapid
            const sRes = await query("SELECT student_id FROM students WHERE sapid = $1", [row.sapid]);
            if (sRes.rows.length === 0) continue; // Skip invalid students
            const student_id = sRes.rows[0].student_id;

            const res = await query(`
                INSERT INTO ica_marks (student_id, subject_code, test_name, marks_obtained, total_marks)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (student_id, subject_code, test_name)
                DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, total_marks = EXCLUDED.total_marks
            `, [student_id, row.subject_code, row.test_name, row.marks, row.total]);

            // rowCount 1 means insert or update.
            // Distinguishing insert vs update on conflict is tricky without RETURNING xmax, but for stats we can aggregate.
            inserted++;
        }

        res.json({ success: true, message: `Processed ${records.length} marks entries.`, count: inserted });

    } catch (err) {
        console.error("ICA Ingest Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
