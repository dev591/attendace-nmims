/* ADDED BY ANTI-GRAVITY */
import express from 'express';
import { recomputeAnalyticsForStudent, recomputeAnalyticsForAll } from '../lib/analytics.js';

const router = express.Router();

/**
 * POST /debug/recompute-analytics
 * body: { sapid?: string }
 * - If sapid provided => recompute single student and return object
 * - If no sapid => recompute all students (may be slow) and return reportPath
 *
 * NOTE: This endpoint is DEV ONLY. Protect it if exposing publicly.
 */
router.post('/recompute-analytics', async (req, res) => {
    try {
        const { sapid } = req.body || {};
        if (sapid) {
            const { analytics, attendanceSummary, subjectMetrics } = await recomputeAnalyticsForStudent(sapid);
            return res.json({ ok: true, sapid, analytics, attendanceSummary, subjectMetrics });
        } else {
            const result = await recomputeAnalyticsForAll();
            if (result.error) return res.status(500).json({ ok: false, error: result.error });
            return res.json({ ok: true, reportPath: result.reportPath, count: result.summary.results.length });
        }
    } catch (err) {
        console.error('/debug/recompute-analytics error', err);
        return res.status(500).json({ ok: false, error: String(err) });
    }
});

router.get('/attendance-explain/:subject_code', async (req, res) => {
    try {
        const { sapid } = req.query; // Pssst, use query for flexibility or req.user in real usage
        const { subject_code } = req.params;

        // In a real app, strict middleware would be here. 
        // For audit, we'll verify the sapid exists.
        if (!sapid) return res.status(400).json({ error: "SAPID required for audit" });

        const { subjectMetrics } = await recomputeAnalyticsForStudent(sapid);
        const subject = subjectMetrics.find(s => s.subject_code === subject_code);

        if (!subject) return res.status(404).json({ error: "Subject logic not found" });

        res.json({
            explanation: "Official Backend Calculation Audit",
            subject_name: subject.subject_name,
            metrics: {
                attended: subject.attended_classes,
                conducted: subject.sessions_conducted,
                total_planned: subject.total_classes,
                mandatory_pct: subject.mandatory_pct
            },
            indicators: subject.academic_indicators,
            audit: subject.audit_trail
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/attendance-audit/:sapid', async (req, res) => {
    const { sapid } = req.params;
    const { getClient } = await import('../db.js');
    const client = await getClient();

    try {
        // ADDED BY ANTI-GRAVITY: Strict Logic Debugger
        const { getClient } = await import('../db.js');
        const client = await getClient();

        try {
            // 1. Fetch Student
            const std = await client.query('SELECT program, year, semester FROM students WHERE sapid = $1', [sapid]);
            if (std.rows.length === 0) return res.json({ error: 'Student not found' });

            const s = std.rows[0];
            const searchProgram = s.program ? s.program.trim().toLowerCase() : '';
            const searchYear = s.year || 1;
            const searchSem = s.semester || 1;

            // 2. Fetch Curriculum
            const curr = await client.query(`
            SELECT * FROM curriculum 
            WHERE LOWER(program) = $1 AND year = $2 AND semester = $3
        `, [searchProgram, searchYear, searchSem]);

            res.json({
                status: curr.rows.length > 0 ? "OK" : "FAILED",
                student: {
                    raw_program: s.program,
                    normalized_program: searchProgram,
                    year: s.year,
                    semester: s.semester
                },
                query: {
                    sql: "SELECT * FROM curriculum WHERE LOWER(program) = $1 AND year = $2 AND semester = $3",
                    params: [searchProgram, searchYear, searchSem]
                },
                curriculum_rows_found: curr.rows.length,
                subjects: curr.rows.map(r => ({ code: r.subject_code, planned: r.total_classes }))
            });

        } catch (e) {
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// ADDED BY ANTI-GRAVITY: Strict Logic Debugger
router.get('/resolve-curriculum/:sapid', async (req, res) => {
    const { sapid } = req.params;
    const { getClient } = await import('../db.js');
    const client = await getClient();

    try {
        // 1. Fetch Student
        const std = await client.query('SELECT program, year, semester FROM students WHERE sapid = $1', [sapid]);
        if (std.rows.length === 0) return res.json({ error: 'Student not found' });

        const s = std.rows[0];
        const searchProgram = s.program ? s.program.trim().toLowerCase() : '';
        const searchYear = s.year || 1;
        const searchSem = s.semester || 1;

        // 2. Fetch Curriculum
        const curr = await client.query(`
            SELECT * FROM curriculum 
            WHERE LOWER(program) = $1 AND year = $2 AND semester = $3
        `, [searchProgram, searchYear, searchSem]);

        res.json({
            status: curr.rows.length > 0 ? "OK" : "FAILED",
            student: {
                raw_program: s.program,
                normalized_program: searchProgram,
                year: s.year,
                semester: s.semester
            },
            query: {
                sql: "SELECT * FROM curriculum WHERE LOWER(program) = $1 AND year = $2 AND semester = $3",
                params: [searchProgram, searchYear, searchSem]
            },
            curriculum_rows_found: curr.rows.length,
            subjects: curr.rows.map(r => ({ code: r.subject_code, planned: r.total_classes }))
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

export default router;
