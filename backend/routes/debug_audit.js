
import express from 'express';
import { getClient } from '../db.js';
import { recomputeAnalyticsForStudent } from '../lib/analytics.js';

const router = express.Router();

/**
 * GET /debug/student/:sapid/system-audit
 * Full transparency explainability endpoint.
 */
router.get('/student/:sapid/system-audit', async (req, res) => {
    const sapid = req.params.sapid;
    const client = await getClient();

    try {
        // 1. Student Basic Info
        const studentRes = await client.query('SELECT * FROM students WHERE sapid = $1', [sapid]);
        if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        const student = studentRes.rows[0];

        // 2. Curriculum Data
        // Resolve key
        const { normalizeProgram, normalizeBranch } = await import('../lib/program_branch_mapper.js');
        const effProg = `${normalizeProgram(student.program).toLowerCase()}-${normalizeBranch(student.dept).toLowerCase()}`;

        const currRes = await client.query(`
            SELECT subject_code, subject_name, total_classes 
            FROM curriculum 
            WHERE program = $1 AND year = $2 AND semester = $3
        `, [effProg, student.year, student.semester]);

        // 3. Timetable (Sessions)
        const subjects = currRes.rows.map(r => r.subject_code);
        // We need subject_ids (which in this system logic often map to code or id). 
        // Let's assume subject_code linkage for now or fetch IDs.
        // Actually analytics uses getSubjectsForStudent which handles this. 
        // Let's use getSubjectsForStudent logic to get IDs.
        const { getSubjectsForStudent } = await import('../lib/subject_service.js');
        const { subjects: enrolledSubjects } = await getSubjectsForStudent(sapid);
        const enrolledIds = enrolledSubjects.map(s => s.subject_id);

        const sessionsRes = await client.query(`
            SELECT session_id, subject_id, date, start_time, end_time, status 
            FROM sessions 
            WHERE subject_id = ANY($1)
            ORDER BY date DESC, start_time ASC
        `, [enrolledIds]);

        // 4. Attendance Records
        const attRes = await client.query(`
            SELECT session_id, present 
            FROM attendance 
            WHERE student_id = $1
        `, [student.student_id]);

        // 5. Final Calculation Run
        const analyticsResult = await recomputeAnalyticsForStudent(sapid);

        const payload = {
            student: {
                sapid: student.sapid,
                program_key: effProg,
                year: student.year,
                semester: student.semester
            },
            curriculum: {
                count: currRes.rowCount,
                rows: currRes.rows
            },
            timetable: {
                count: sessionsRes.rowCount,
                rows: sessionsRes.rows.map(s => ({
                    ...s,
                    is_conducted: (s.status === 'conducted' || new Date(s.date) < new Date()) // Simplified check
                }))
            },
            attendance_records: {
                count: attRes.rowCount,
                rows: attRes.rows
            },
            final_metrics: analyticsResult.subjectMetrics.map(m => ({
                code: m.subject_code,
                name: m.subject_name,
                total_classes_planned: m.total_classes, // From Curriculum
                conducted: m.classes_conducted,         // From Timetable
                attended: m.classes_attended,           // From Logic
                pct: m.attendance_percentage,            // The Result
                confidence: m.confidence                // NEW: Verification
            }))
        };

        res.json(payload);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

export default router;
