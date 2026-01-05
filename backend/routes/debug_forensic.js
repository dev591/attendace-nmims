
import express from 'express';
import { getClient, query } from '../db.js';
import { normalizeProgram } from '../lib/program_mapper.js';
import { normalizeBranch } from '../lib/program_branch_mapper.js';
import { getSubjectsForStudent } from '../lib/subject_service.js';

const router = express.Router();

/**
 * GET /__debug/student/:sapid/full-dump
 * FORENSIC AUDIT ENDPOINT
 * As requested by User (Step 6).
 */
router.get('/student/:sapid/full-dump', async (req, res) => {
    const { sapid } = req.params;
    const client = await getClient();
    const logs = [];

    const log = (msg, data = null) => {
        const entry = `[FORENSIC] ${msg}`;
        console.log(entry, data || '');
        logs.push({ message: msg, data });
    };

    try {
        log(`Starting Forensic Audit for SAPID: ${sapid}`);

        // 1. GLOBAL COUNTS
        const counts = {};
        const countTables = ['students', 'curriculum', 'enrollments', 'subjects'];
        for (const t of countTables) {
            const r = await client.query(`SELECT COUNT(*) as c FROM ${t}`);
            counts[t] = parseInt(r.rows[0].c);
        }
        log("Global Table Counts", counts);

        if (counts.enrollments === 0) {
            throw new Error("ROOT CAUSE: Enrollments table is EMPTY.");
        }

        // 2. FETCH STUDENT RAW
        const sRes = await client.query('SELECT * FROM students WHERE sapid = $1 OR student_id = $1', [sapid]);
        if (sRes.rows.length === 0) {
            throw new Error(`Student not found for SAPID: ${sapid}`);
        }
        const student = sRes.rows[0];
        log("Student Row found", student);

        // 3. NORMALIZE KEYS
        const nProg = normalizeProgram(student.program);
        const nBranch = normalizeBranch(student.dept); // Assuming 'dept' column
        let effectiveProgram = nProg;

        // REPLICATE LOGIC from subject_service.js (Manual check)
        if (effectiveProgram === 'engineering' && nBranch) {
            effectiveProgram = `engineering-${nBranch.toLowerCase()}`;
        }

        const keys = {
            raw_program: student.program,
            raw_dept: student.dept,
            norm_program: nProg,
            norm_branch: nBranch,
            effective_program_key: effectiveProgram,
            year: student.year,
            semester: student.semester
        };
        log("Normalization Keys", keys);

        // 4. CHECK CURRICULUM RAW
        // Query matching subject_service logic
        const currQuery = `
            SELECT * FROM curriculum 
            WHERE LOWER(program) = LOWER($1) 
            AND year = $2 
            AND semester = $3
        `;
        const currParams = [effectiveProgram, student.year, student.semester];

        log("Executing Curriculum Query", { query: currQuery, params: currParams });

        const currRes = await client.query(currQuery, currParams);
        log(`Curriculum Rows Found: ${currRes.rows.length}`, currRes.rows.map(c => c.subject_code));

        if (currRes.rows.length === 0) {
            log("❌ CURRICULUM MISMATCH DETECTED");
            // PROBE WHY
            // Check if program exists at all
            const progCheck = await client.query('SELECT DISTINCT program FROM curriculum');
            log("Available Programs in Curriculum", progCheck.rows.map(r => r.program));
        }

        // 5. CHECK ENROLLMENTS RAW
        const enrollQuery = `SELECT * FROM enrollments WHERE student_id = $1`;
        const enrollRes = await client.query(enrollQuery, [student.student_id]);
        log(`Enrollment Rows Found: ${enrollRes.rows.length}`, enrollRes.rows);

        // 6. SUBJECT SERVICE RESOLUTION (The "Liar" Check)
        let subjectServiceResult = null;
        try {
            subjectServiceResult = await getSubjectsForStudent(sapid);
            log(`Subject Service Returned: ${subjectServiceResult.subjects.length} subjects`);
        } catch (e) {
            log(`Subject Service CRASHED: ${e.message}`);
        }

        // 7. HARD FAIL CHECK
        if (currRes.rows.length === 0) throw new Error("SUBJECT_RESOLUTION_FAILED: No Curriculum found for this Student's Program/Year/Sem.");
        if (enrollRes.rows.length === 0) throw new Error("SUBJECT_RESOLUTION_FAILED: No Enrollments found in 'enrollments' table.");
        if (!subjectServiceResult || subjectServiceResult.subjects.length === 0) throw new Error("SUBJECT_RESOLUTION_FAILED: Subject Service returned 0 despite raw data existing.");

        res.json({
            success: true,
            status: "HEALTHY",
            logs,
            data: {
                student,
                counts,
                keys,
                curriculum_count: currRes.rows.length,
                enrollment_count: enrollRes.rows.length,
                subject_service_count: subjectServiceResult?.subjects?.length || 0,
                curriculum_sample: currRes.rows,
                enrollment_sample: enrollRes.rows
            }
        });

    } catch (e) {
        log(`❌ FORENSIC FAILURE: ${e.message}`);
        res.status(500).json({
            success: false,
            error: e.message,
            logs
        });
    } finally {
        client.release();
    }
});

export default router;
