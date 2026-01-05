
import { query } from '../db.js';
import { normalizeProgram, normalizeBranch } from './program_branch_mapper.js';

// STRICT VALIDATION MAPPING
const YEAR_TO_SEMESTERS = {
    1: [1, 2],
    2: [3, 4],
    3: [5, 6],
    4: [7, 8]
};

/**
 * Auto-enrolls a student into all subjects matching their CORRECT Year, Semester, AND Branch.
 * Performs a HARD CLEANUP first to ensure no cross-year pollution.
 * 
 * @param {string} studentId - The internal UUID of the student
 * @param {string} program - Student's program (e.g. "B.Tech")
 * @param {string} branch - Student's branch (e.g. "Computer Engineering", "Data Science")
 * @param {number|string} semester - Student's semester
 * @param {number|string} year - Student's academic year
 * @returns {Promise<number>} - Number of enrollments
 */
export async function autoEnrollStudent(studentId, program, branch, semester, year) {
    if (!studentId || !program || !semester || !year) {
        console.warn("[AutoEnroll] Skipped: Missing studentId, program, semester, or year.");
        return 0;
    }

    try {
        // STRICT NORMALIZATION
        const normProgram = normalizeProgram(program);
        const normBranch = normalizeBranch(branch);
        const normSemester = parseInt(semester);
        const normYear = parseInt(year);

        console.log(`[AutoEnroll] Processing for Student ${studentId}`);
        console.log(`[AutoEnroll] Match Criteria: Program='${normProgram}', Branch='${normBranch}', Year=${normYear}, Semester=${normSemester}`);

        if (isNaN(normSemester) || isNaN(normYear)) {
            console.error(`[AutoEnroll] ❌ Invalid Semester/Year: Sem=${semester}, Year=${year}`);
            return 0;
        }

        // MANDATORY: Branch is required. No silent fallback.
        if (!normBranch) {
            console.error(`[AutoEnroll] ❌ Branch is MISSING for student ${studentId}. Cannot auto-enroll.`);
            throw new Error("BRANCH_REQUIRED_FOR_ENROLLMENT");
        }

        // 1. VALIDATE Year-Semester Logic
        const validSemesters = YEAR_TO_SEMESTERS[normYear];
        if (!validSemesters || !validSemesters.includes(normSemester)) {
            console.error(`[AutoEnroll] ❌ LOGIC ERROR: Semester ${normSemester} is invalid for Year ${normYear}`);
            return 0;
        }

        // 2. HARD CLEANUP (Purge old/wrong enrollments)
        await query(`DELETE FROM enrollments WHERE student_id = $1`, [studentId]);

        // 3. INSERT Valid Subjects Only (STRICT BRANCH MATCH)
        // STRICT RULE: Program MUST be "program-branch" (e.g. "engineering-ds")
        let effectiveProgram = `${normProgram.toLowerCase()}-${normBranch.toLowerCase()}`;

        console.log(`[AutoEnroll] Effective Lookup Program: '${effectiveProgram}'`);

        const res = await query(`
            INSERT INTO enrollments (student_id, subject_id)
            SELECT DISTINCT $1, s.subject_id
            FROM curriculum c
            JOIN subjects s ON c.subject_code = s.code
            WHERE LOWER(c.program) = $2 
            AND c.semester = $3
            AND c.year = $4
            ON CONFLICT (student_id, subject_id) DO NOTHING
            RETURNING subject_id
        `, [studentId, effectiveProgram, normSemester, normYear]);

        const subjects = res.rows;

        if (subjects.length === 0) {
            console.log(`[AutoEnroll] ℹ️ No new enrollments found for Year ${normYear} Sem ${normSemester}.`);
            return 0;
        }

        // STRICT USER REQUIREMENT: Max 8 Subjects
        if (subjects.length > 8) {
            console.error(`[AutoEnroll] ❌ Too many subjects (${subjects.length}) for ${effectiveProgram}. Max allowed is 8.`);
            throw new Error("MAX_SUBJECTS_EXCEEDED");
        }

        console.log(`[AutoEnroll] Found ${subjects.length} subjects. Proceeding to enroll...`);

        // [USER REQUEST] REMOVED 12-SUBJECT LIMIT CAP.
        // Replaced with just logging.
        if (res.rowCount > 12) {
            console.warn(`[AutoEnroll] ⚠️ HIGH ENROLLMENT COUNT: ${res.rowCount} subjects. (Limit removed per request)`);
        }

        if (res.rowCount > 5) {
            console.warn(`[AutoEnroll] Subject count > 5. Verify if elective overlap occurred.`);
            console.warn(`Program: ${effectiveProgram}, Year: ${normYear}, Sem: ${normSemester}`);
            console.warn(`Resolved: ${res.rowCount} subjects`);
        }

        if (res.rowCount > 0) {
            console.log(`[AutoEnroll] ✅ Successfully enrolled in ${res.rowCount} new subjects.`);
        } else {
            console.log(`[AutoEnroll] ℹ️ No new enrollments found for Year ${normYear} Sem ${normSemester}.`);
        }

        return res.rowCount;

    } catch (err) {
        console.error("[AutoEnroll] ❌ Failed:", err);
        // Propagate the specific branch error so imports can report it
        if (err.message === "BRANCH_REQUIRED_FOR_ENROLLMENT") throw err;
        return 0;
    }
}
