import express from 'express';
import { recomputeAnalyticsForStudent, safeStudentResponse } from '../lib/analytics.js';
import { getAllBadgesWithStatus, evaluateBadgesForStudent } from '../lib/badges.js';
import { query } from '../db.js';
import { getDailyContent } from '../lib/daily_content.js'; // NEW IMPORT

const router = express.Router();

/**
 * GET /student/:sapid/snapshot
 * Returns student payload with guaranteed analytics & attendanceSummary fields.
 */
router.get('/student/:sapid/snapshot', async (req, res) => {
    try {
        let sapid = req.params.sapid;
        // Normalize: If ID starts with 'S' or 's', strip it to match numeric DB sapid
        if (/^[Ss]\d+$/.test(sapid)) {
            sapid = sapid.substring(1);
        }
        const q = await query('SELECT student_id, sapid, name, course_id, program FROM students WHERE sapid=$1 LIMIT 1', [sapid]);
        if (q.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        const studentRow = q.rows[0];

        // compute analytics (fast) and attach if none
        const { analytics, attendanceSummary, subjectMetrics } = await recomputeAnalyticsForStudent(sapid);

        // FETCH TODAY'S CLASSES (Timetable)
        // Only if student is enrolled in them (implicitly via query or curriculum)
        // Ideally filter by enrolled subjects
        const enrolledSubjectIds = subjectMetrics.map(s => s.subject_id);

        const todayQ = await query(`
            SELECT session_id, subject_id, start_time, end_time, type, room, status
            FROM sessions
            WHERE date = CURRENT_DATE
            AND subject_id = ANY($1)
            ORDER BY start_time ASC
        `, [enrolledSubjectIds]);

        const todays_classes = todayQ.rows.map(row => {
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
                ...row,
                subject_name: subj ? subj.subject_name : 'Unknown',
                subject_code: subj ? subj.subject_code : row.subject_id,
                time_status: timeStatus
            };
        });

        // EVALUATE BADGES DYNAMICALLY (Sync Check)
        await evaluateBadgesForStudent(sapid);
        // GET FORMATTED BADGES
        const badges = await getAllBadgesWithStatus(sapid);

        // DAILY CONTENT LOGIC (Engineering Only)
        let daily_insight = null;
        if (studentRow.program && studentRow.program.toLowerCase().includes('engineering')) {
            daily_insight = await getDailyContent();
        }

        // Strict API Contract Mapping
        const payload = {
            student: {
                sapid: studentRow.sapid,
                name: studentRow.name,
                program: studentRow.program,
                year: studentRow.year || 1, // Default if null
                semester: studentRow.semester || 1, // Default if null
                batch: 'A' // Placeholder or from DB if added later
            },
            subjects: subjectMetrics, // Now contains strict fields from analytics.js
            todays_classes, // NEW FIELD
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

        return res.json(payload);
    } catch (err) {
        console.error('/student/:sapid/snapshot error', err);
        return res.status(500).json({ ok: false, error: String(err) });
    }
});

export default router;
