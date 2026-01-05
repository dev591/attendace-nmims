import { query } from '../db.js';
import { normalizeProgram } from './program_mapper.js';
import { normalizeBranch } from './program_branch_mapper.js';

/**
 * Single Source of Truth for Student Subject Resolution.
 * Uses GLOBAL SEMESTER matching (ignores Year for filtering).
 * 
 * @param {string} sapid 
 * @returns {Promise<{student: Object, subjects: Array}>}
 */
export async function getSubjectsForStudent(sapid) {
    // 1. Get Student Context
    // Robustly handle SAPID (numeric) or STUDENT_ID (S-prefixed)
    const sRes = await query(
        'SELECT student_id, sapid, program, dept, semester, name, year FROM students WHERE sapid = $1 OR student_id = $1',
        [sapid]
    );

    if (sRes.rows.length === 0) {
        throw new Error(`Student SAPID ${sapid} not found`);
    }

    const student = sRes.rows[0];

    // CONSTRUCT EFFECTIVE PROGRAM strictly
    let effectiveProgram = normalizeProgram(student.program);
    const normBranch = normalizeBranch(student.dept);

    // ANTI-GRAVITY STRICT UPDATE: Match enrollment_service logic
    if (effectiveProgram.toLowerCase() === 'engineering') {
        if (normBranch) {
            effectiveProgram = `${effectiveProgram.toLowerCase()}-${normBranch.toLowerCase()}`;
        } else {
            // If branch is missing for Engineering, we basically fail to resolve specifics.
            // But we keep it as 'engineering' in case there are common subjects? 
            // User mandate: "Branch must be mandatory". 
            // So we default to lowecase 'engineering' which likely yields 0 results in strict curriculum, correct.
            effectiveProgram = effectiveProgram.toLowerCase();
        }
    } else {
        effectiveProgram = effectiveProgram.toLowerCase();
    }

    console.log(`[SubjectService] Resolved Context: Program='${effectiveProgram}' (Base: ${student.program}, Dept: ${student.dept}), Year=${student.year}, Sem=${student.semester}`);

    // 2. Query Enrollments (Source of Truth) WITH Curriculum Metadata
    // Join curriculum to get total_classes, credits, etc. specific to this student's context
    const enrollRes = await query(`
        SELECT 
            s.code as subject_code, 
            s.name as subject_name, 
            s.subject_id,
            c.total_classes,
            c.min_attendance_pct,
            4 as credits
        FROM enrollments e
        JOIN subjects s ON e.subject_id = s.subject_id
        JOIN curriculum c ON s.code = c.subject_code 
            AND LOWER(c.program) = LOWER($2) 
            AND c.semester = $3
            AND c.year = $4
        WHERE e.student_id = $1
        ORDER BY s.code ASC
    `, [student.student_id, effectiveProgram, student.semester, student.year]);

    console.log(`[SubjectService] Enrollments Found: ${enrollRes.rows.length}`);
    if (enrollRes.rows.length === 0) {
        console.warn(`[SubjectService] WARNING: No enrollments found for ${student.student_id}. Check 'enrollments' table or LEFT JOIN conditions.`);
    }

    return {
        student: {
            ...student,
            normalized_program: effectiveProgram // Return the resolved program for frontend context
        },
        subjects: enrollRes.rows
    };
}
