import express from 'express';
import { recomputeAnalyticsForStudent, safeStudentResponse } from '../lib/analytics.js';
import { getAllBadgesWithStatus, evaluateBadgesForStudent } from '../lib/badges.js';
import { query } from '../db.js';
import { getDailyContent } from '../lib/daily_content.js';
import { NotificationService } from '../services/NotificationService.js';

const router = express.Router();

/**
 * GET /student/:sapid/snapshot
 * Returns student payload with guaranteed analytics & attendanceSummary fields.
 */
router.get('/student/:sapid/snapshot', async (req, res) => {
    try {
        let sapid = req.params.sapid;

        // --- 1. ADMIN CIRCUIT BREAKER ---
        // If User is Admin/Director, DO NOT attempt to load student pipeline.
        if (sapid === 'ADMIN' || sapid === 'DIRECTOR' || sapid.startsWith('ADMIN')) {
            console.log(`[Circuit Breaker] Admin/Director '${sapid}' accessing student snapshot. Returning minimal dash.`);
            return res.json({
                student: { name: 'Administrator', sapid, program: 'Administration', role: 'admin' },
                todays_classes: [],
                session_history: [],
                analytics: { attendanceRate: 100, momentum: 'stable' },
                meta: { role_override: true }
            });
        }

        const q = await query('SELECT student_id, sapid, name, course_id, program, year, semester FROM students WHERE sapid=$1 OR student_id=$1 LIMIT 1', [sapid]);

        // --- 2. STUDENT NOT FOUND SAFETY ---
        if (q.rows.length === 0) {
            console.warn(`[Snapshot] Student '${sapid}' not found. Returning safe empty state.`);
            return res.json({
                student: { name: 'Guest/Unknown', sapid, program: 'N/A' },
                todays_classes: [],
                analytics: { attendanceRate: 0 },
                meta: { error: 'Student Not Found' }
            });
        }

        const studentRow = q.rows[0];

        // compute analytics (fast) and attach if none
        const { analytics, attendanceSummary, subjectMetrics } = await recomputeAnalyticsForStudent(sapid);

        const studentId = studentRow.student_id;
        const enrolledSubjectIds = subjectMetrics.map(s => s.subject_id);

        // FETCH TODAY'S CLASSES (Timetable)
        // REFACTOR: Use PostgresProvider to ensure Cohort Logic is applied
        const { PostgresProvider } = await import('../providers/PostgresProvider.js');
        const provider = new PostgresProvider();

        // Get today's classes (1 day range)
        const timetableRows = await provider.getTimetable(studentId, 1);

        const todays_classes = timetableRows.map(row => {
            const now = new Date();
            const [sh, sm] = row.start_time.split(':');
            const [eh, em] = row.end_time.split(':');

            const start = new Date(); start.setHours(sh, sm, 0);
            const end = new Date(); end.setHours(eh, em, 0);

            let timeStatus = 'UPCOMING';
            if (now > end) timeStatus = 'CONDUCTED';
            else if (now >= start && now <= end) timeStatus = 'ONGOING';

            // Find subject name
            const subj = subjectMetrics.find(s => s.subject_id === row.subject_id);
            return {
                session_id: row.id,
                subject_id: row.subject_id,
                start_time: row.start_time,
                end_time: row.end_time,
                type: row.type || 'Lecture',
                room: row.room,
                status: row.status,
                subject_name: subj ? subj.subject_name : (row.subject_id || 'Unknown'),
                subject_code: subj ? subj.subject_code : (row.code || row.subject_id),
                time_status: timeStatus
            };
        });

        // 3. FETCH FULL SESSION HISTORY (For Subject Details Page)
        // Past and Future sessions for all enrolled subjects
        const historyQ = await query(`
            SELECT 
                s.session_id, s.subject_id, s.date, s.start_time, s.end_time, s.type, s.room, s.status,
                a.present, a.marked_at
            FROM sessions s
            LEFT JOIN attendance a ON s.session_id = a.session_id AND a.student_id = $1
            WHERE s.subject_id = ANY($2)
            ORDER BY s.date ASC, s.start_time ASC
        `, [studentId, enrolledSubjectIds]);

        const session_history = historyQ.rows.map(row => {
            const subj = subjectMetrics.find(s => s.subject_id === row.subject_id);
            return {
                ...row,
                subject_name: subj ? subj.subject_name : 'Unknown',
                subject_code: subj ? subj.subject_code : row.subject_id,
                // If past and no attendance, assume based on policy? For now just null.
                attendance_status: row.present === true ? 'PRESENT' : (row.present === false ? 'ABSENT' : 'PENDING')
            };
        });

        // EVALUATE BADGES DYNAMICALLY (Sync Check)
        await evaluateBadgesForStudent(sapid);
        // GET FORMATTED BADGES
        const badges = await getAllBadgesWithStatus(sapid);

        // DAILY CONTENT LOGIC (Clean Provider Pattern)
        // If content exists in DB, fetch it. Else null.
        let daily_insight = null;
        // Previously hardcoded. Now removed for Oracle Readiness.
        // if (studentRow.program && ...) { ... }

        // Strict API Contract Mapping
        const payload = {
            student: {
                id: studentRow.student_id, // CRITICAL FIX: Frontend needs this for links
                sapid: studentRow.sapid,
                name: studentRow.name,
                program: studentRow.program,
                year: studentRow.year || 1, // Default if null
                semester: studentRow.semester || 1, // Default if null
                batch: 'A' // Placeholder or from DB if added later
            },
            subjects: subjectMetrics, // Now contains strict fields from analytics.js
            todays_classes, // NEW FIELD
            session_history, // FULL HISTORY
            daily_insight, // NEW FIELD
            meta: {
                semester_label: `Year ${studentRow.year || 1} • Semester ${studentRow.semester || 1}`,
                last_updated: new Date().toISOString()
            },
            // Legacy support
            analytics: {
                ...analytics,
                badges: badges.filter(b => b.is_unlocked).map(b => b.name) // Legacy array of strings
            },
            badges, // Full object list
            attendanceSummary
        };

        // TRIGGER AUTO-ALERTS (Async, don't await)
        NotificationService.checkAttendanceRisk(studentRow.student_id).catch(err => console.error("Auto-Alert Error:", err));

        return res.json(payload);
    } catch (err) {
        console.error('/student/:sapid/snapshot error', err);
        return res.status(500).json({ ok: false, error: String(err) });
    }
});

// GET /student/:sapid/notifications (New Engine)
router.get('/student/:sapid/notifications', async (req, res) => {
    try {
        const { sapid } = req.params;
        const sRes = await query('SELECT student_id FROM students WHERE sapid = $1 OR student_id = $1', [sapid]);
        if (sRes.rows.length === 0) return res.json([]);

        const studentId = sRes.rows[0].student_id;

        const { rows } = await query(`
            SELECT id, title, message, type, link, is_read, created_at 
            FROM notifications 
            WHERE student_id = $1 
            ORDER BY created_at DESC 
            LIMIT 50
        `, [studentId]);

        res.json(rows);
    } catch (err) {
        // OPTIONAL TABLE SAFETY: If table missing, return empty
        if (err.message.includes('association') || err.message.includes('relation "notifications" does not exist')) {
            console.warn("[OPTIONAL] Notifications table missing. Returned [].");
            return res.json([]);
        }
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /student/:sapid/timetable
 * Helper route for ClassesTab.jsx
 */
router.get('/student/:sapid/timetable', async (req, res) => {
    try {
        const { sapid } = req.params;
        const view = req.query.view || 'week'; // 'today' or 'week'

        // Resolve ID
        const sRes = await query('SELECT student_id, program, semester FROM students WHERE sapid = $1 OR student_id = $1', [sapid]);
        if (sRes.rows.length === 0) return res.status(404).json({ error: "Student not found" });
        const student = sRes.rows[0];

        // Provider
        const { PostgresProvider } = await import('../providers/PostgresProvider.js');
        const provider = new PostgresProvider();

        // 1 Day for 'today', 7 for 'week'
        const days = (view === 'today') ? 1 : 7;
        const rows = await provider.getTimetable(student.student_id, days);

        // Map for Frontend
        const sessions = rows.map(r => ({
            ...r,
            start_time: r.time, // Frontend expects 'start_time'
            subject_name: r.subject_name || r.code,
            subject_code: r.code,
            location: r.room,     // Frontend expects 'location'
            live_status: r.status // Frontend expects 'live_status'
        }));

        res.json({ sessions });

    } catch (e) {
        console.error("Timetable Route Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// LEGACY: GET /student/:sapid/announcements (Keep for backward compat if needed)
router.get('/student/:sapid/announcements', async (req, res) => {
    try {
        const { sapid } = req.params;
        // Fetch global + targeted announcements
        // Logic: target_group='all' OR (target_group='student' AND target_value=sapid)
        // In real app, we'd also check 'school' or 'batch' from student profile
        const { rows } = await query(`
            SELECT * FROM announcements 
            WHERE target_group = 'all' 
            OR (target_group = 'student' AND target_value = $1)
            ORDER BY created_at DESC LIMIT 20
        `, [sapid]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
