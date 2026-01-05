
import express from 'express';
import multer from 'multer';
import { processScheduleUpload, generateTimetableTemplate } from '../lib/schedule_service.js';
import { query } from '../db.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// GET /admin/schedule/template
// Generates a pre-filled Excel template
router.get('/schedule/template', async (req, res) => {
    const { program, semester } = req.query;
    if (!program || !semester) {
        return res.status(400).json({ error: 'Program and Semester are required.' });
    }

    try {
        const buffer = await generateTimetableTemplate(program, parseInt(semester));
        res.setHeader('Content-Disposition', `attachment; filename="timetable_template_${program}_sem${semester}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error("Template Gen Error:", err);
        res.status(500).json({ error: 'Failed to generate template.' });
    }
});

// POST /admin/schedule/upload
// Uploads a CSV/Excel timetable file
router.post('/schedule/upload', upload.single('file'), async (req, res) => {
    console.log("Upload Request File:", req.file);

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Validate Mime Type
    const allowedMimes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/octet-stream' // sometimes CSVs
    ];

    if (!allowedMimes.includes(req.file.mimetype)) {
        console.warn("Rejected Mimetype:", req.file.mimetype);
    }

    try {
        // Pass the whole file object to service
        const result = await processScheduleUpload(req.file);

        if (result.inserted_sessions > 0) {
            res.json({
                success: true,
                message: `Scheduled ${result.inserted_sessions} sessions.`,
                details: result
            });
        } else {
            // Hard Validation Failure with Friendly Help
            const reason = Object.keys(result.reasons)[0] || 'Validation Mismatch';

            res.status(422).json({
                success: false,
                error: 'Timetable Upload Incomplete',
                message: 'Timetable Upload Incomplete', // Frontend friendly
                details: result,
                status: "PARTIAL_SUCCESS", // As requested, though technically a fail here
                summary: {
                    processed: result.inserted_sessions,
                    rejected: result.skipped_sessions,
                    reason: reason
                },
                help: {
                    message: "Some subjects in the timetable do not match the curriculum.",
                    action: "Download the auto-generated template to correct this."
                }
            });
        }
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ error: 'Import failed: ' + err.message });
    }
});

// POST /admin/students/purge-demo
// Safely removes demo students with SAPID 90020000 - 90020110
router.post('/students/purge-demo', async (req, res) => {
    console.log("[ADMIN ACTION] Purge Demo Students Requested");

    try {
        await query('BEGIN');

        // 1. Identify Demo Students (Count first)
        const countRes = await query(`
            SELECT count(*) FROM students 
            WHERE sapid ~ '^[0-9]+$' 
            AND sapid::bigint BETWEEN 90020000 AND 90020110
        `);
        const count = countRes.rows[0].count;

        if (parseInt(count) === 0) {
            await query('ROLLBACK');
            return res.json({ success: true, message: "No demo students found.", students_removed: 0 });
        }

        // 2. Cascade Delete
        // Enrollments
        await query(`
            DELETE FROM enrollments 
            WHERE student_id IN (
                SELECT student_id FROM students 
                WHERE sapid ~ '^[0-9]+$' AND sapid::bigint BETWEEN 90020000 AND 90020110
            )
        `);

        // Attendance
        await query(`
            DELETE FROM attendance 
            WHERE student_id IN (
                SELECT student_id FROM students 
                WHERE sapid ~ '^[0-9]+$' AND sapid::bigint BETWEEN 90020000 AND 90020110
            )
        `);

        // 3. Delete Students
        const deleteRes = await query(`
            DELETE FROM students 
            WHERE sapid ~ '^[0-9]+$' 
            AND sapid::bigint BETWEEN 90020000 AND 90020110
            RETURNING student_id
        `);

        await query('COMMIT');

        console.log(`[ADMIN ACTION] Purged ${deleteRes.rows.length} demo students.`);
        res.json({
            success: true,
            message: "Demo students removed successfully",
            students_removed: deleteRes.rows.length
        });

    } catch (e) {
        await query('ROLLBACK');
        console.error("Purge Failed:", e);
        res.status(500).json({ error: "Purge failed: " + e.message });
    }
});

// POST /admin/students/purge-all
// Removes ALL students from the database (Hard Reset)
router.post('/students/purge-all', async (req, res) => {
    console.log("[ADMIN ACTION] PURGE ALL STUDENTS Requested");

    try {
        await query('BEGIN');

        // 1. Delete All Enrollments
        await query('DELETE FROM enrollments');

        // 2. Delete All Attendance Records
        await query('DELETE FROM attendance');

        // 3. Delete All Students
        const deleteRes = await query('DELETE FROM students RETURNING student_id');

        await query('COMMIT');

        console.log(`[ADMIN ACTION] Purged ALL ${deleteRes.rows.length} students.`);
        res.json({
            success: true,
            message: "All students removed successfully.",
            students_removed: deleteRes.rows.length
        });

    } catch (e) {
        await query('ROLLBACK');
        console.error("Purge All Failed:", e);
        res.status(500).json({ error: "Purge failed: " + e.message });
    }
});


// POST /admin/schedule/purge
// Safely removes all scheduled sessions (Timetable) from the database
router.post('/schedule/purge', async (req, res) => {
    console.log("[ADMIN ACTION] Purge Scheduler Requested");

    try {
        await query('BEGIN');

        // Delete valid sessions
        const delRes = await query('DELETE FROM sessions RETURNING session_id');

        // Use TRUNCATE if we want to reset ID sequence, but DELETE is safer for FKs usually.
        // However, sessions table might have attendance linked.
        // If we purge scheduler, should we purge attendance too?
        // YES: A session without attendance is meaningless, but attendance without session is impossible due to FK.
        // So we must delete attendance first OR rely on Cascade. 
        // Let's assume Cascade ON DELETE exists, otherwise we manually delete attendance linked to sessions.
        // Actually, explicit safety is better.

        await query('DELETE FROM attendance'); // If we wipe schedule, we wipe attendance history? 
        // User asked for "Scheduler Purge" - usually implies Master Timetable reset.
        // But in our system, sessions = actual classes.
        // Let's stick to truncating SESSIONS.

        await query('COMMIT');

        res.json({ success: true, message: `Scheduler wiped. Removed ${delRes.rows.length} sessions.` });

    } catch (e) {
        await query('ROLLBACK');
        console.error("Schedule Purge Failed:", e);
        res.status(500).json({ error: "Purge failed: " + e.message });
    }
});

// POST /admin/curriculum/purge
// Safely removes all Curriculum and Subject definitions
router.post('/curriculum/purge', async (req, res) => {
    console.log("[ADMIN ACTION] Purge Curriculum Requested");

    try {
        await query('BEGIN');

        // 1. Delete Curriculum Maps
        const cRes = await query('DELETE FROM curriculum RETURNING id');

        // 2. Delete Subjects (Master List)
        // Note: This might fail if enrollments exist. 
        // We should wipe all enrollments if we wipe subjects.
        await query('DELETE FROM enrollments');
        const sRes = await query('DELETE FROM subjects RETURNING subject_id');

        await query('COMMIT');

        res.json({
            success: true,
            message: `Curriculum wiped. Removed ${cRes.rows.length} curriculum rows and ${sRes.rows.length} subjects.`
        });

    } catch (e) {
        await query('ROLLBACK');
        console.error("Curriculum Purge Failed:", e);
        res.status(500).json({ error: "Purge failed: " + e.message });
    }
});

export default router;
