
import { query } from '../db.js';
import { normalizeProgram, normalizeBranch } from './program_branch_mapper.js';

// STRICT VALIDATION MAPPING
const YEAR_TO_SEMESTERS = {
    1: [1, 2],
    2: [3, 4],
    3: [5, 6],
    4: [7, 8]
};

function normalizeSemester(year, semester) {
    const min = (year * 2) - 1;
    const max = year * 2;

    if (semester < min || semester > max) {
        console.warn(`[AUTO-FIX] Semester ${semester} invalid for Year ${year}. Using ${min}`);
        return min;
    }
    return semester;
}

/**
 * Auto-enrolls a student into all subjects matching their CORRECT Year, Semester, AND Branch.
 * Performs a HARD CLEANUP first to ensure no cross-year pollution.
 * 
 * @param {string} studentId - The internal UUID of the student
 * @param {string} program - Student's program (e.g. "B.Tech")
 * @param {string} branch - Student's branch (e.g. "Computer Engineering", "Data Science")
 * @param {number|string} semester - Student's semester
 * @param {number|string} year - Student's academic year
 * @returns {Promise<{enrolled: number, status: string, auto_corrected: boolean}>}
 */
export async function autoEnrollStudent(studentId, program, branch, semester, year) {
    if (!studentId || !program || !semester || !year) {
        console.warn("[AutoEnroll] Skipped: Missing studentId, program, semester, or year.");
        return { enrolled: 0, status: 'MISSING_DATA' };
    }

    try {
        // STRICT NORMALIZATION
        const normProgram = normalizeProgram(program);
        const normBranch = normalizeBranch(branch);
        let normYear = parseInt(year);
        let normSemester = parseInt(semester);
        let autoCorrected = false;

        console.log(`[AutoEnroll] Processing for Student ${studentId}`);

        if (isNaN(normSemester) || isNaN(normYear)) {
            console.error(`[AutoEnroll] ❌ Invalid Semester/Year: Sem=${semester}, Year=${year}`);
            return { enrolled: 0, status: 'INVALID_ACADEMIC_DATA' };
        }

        // 1. AUTO-CORRECT SEMESTER LOGIC
        const correctedSem = normalizeSemester(normYear, normSemester);
        if (correctedSem !== normSemester) {
            console.warn(`[AUTO-FIX] Student ${studentId} Semester ${normSemester} -> ${correctedSem} (Year ${normYear})`);
            normSemester = correctedSem;
            autoCorrected = true;
        }

        // 2. HARD CLEANUP (Purge old/wrong enrollments)
        await query(`DELETE FROM enrollments WHERE student_id = $1`, [studentId]);

        // 3. DETERMINE CURRICULUM KEY (Strict Branch vs Common)
        let effectiveProgram = normProgram.toLowerCase();
        let methodsTried = [];

        // Strategy 1: Program + Branch (e.g. "engineering-ds")
        let primaryKey = effectiveProgram;
        if (normBranch && normBranch.toLowerCase() !== normProgram.toLowerCase() && normBranch.toLowerCase() !== 'engineering') {
            primaryKey = `${effectiveProgram}-${normBranch.toLowerCase()}`;
        }
        methodsTried.push(primaryKey);

        // Strategy 2: Program Only (Fallback, e.g. "engineering")
        let secondaryKey = effectiveProgram; // e.g., "engineering"
        if (primaryKey !== secondaryKey) {
            methodsTried.push(secondaryKey);
        }

        console.log(`[AutoEnroll] Enrollment Keys Strategy: ${methodsTried.join(' -> ')}`);

        // 4. INSERT Valid Subjects
        // Try Primary Key
        let res = await attemptEnrollment(studentId, primaryKey, normSemester, normYear);

        // Try Secondary Key if Primary failed
        if (res.rowCount === 0 && secondaryKey && primaryKey !== secondaryKey) {
            console.log(`[AutoEnroll] Primary key '${primaryKey}' yielded 0 subjects. Trying fallback '${secondaryKey}'...`);
            res = await attemptEnrollment(studentId, secondaryKey, normSemester, normYear);
        }

        const count = res.rowCount;
        const subjects = res.rows || []; // Ensure rows exists

        if (count === 0) {
            console.warn(`[AutoEnroll] ⚠️ NO_SUBJECTS_CONFIGURED for ${methodsTried.join(' or ')} Y${normYear} S${normSemester}`);
            // Do NOT create placeholder. UI should handle 'NO_SUBJECTS_CONFIGURED'.
            return { enrolled: 0, status: 'NO_SUBJECTS_CONFIGURED', auto_corrected: autoCorrected };
        }

        // 5. MAX CAP CHECK
        if (count > 12) {
            console.warn(`[AutoEnroll] ⚠️ High enrollment count: ${count} subjects.`);
        }

        console.log(`[AutoEnroll] ✅ Successfully enrolled in ${count} subjects.`);
        return { enrolled: count, status: 'ENROLLED', auto_corrected: autoCorrected };

    } catch (err) {
        console.error("[AutoEnroll] ❌ Failed:", err);
        return { enrolled: 0, status: 'ERROR', error: err.message };
    }
}

async function attemptEnrollment(studentId, programKey, semester, year) {
    return query(`
        INSERT INTO enrollments (student_id, subject_id)
        SELECT DISTINCT $1, s.subject_id
        FROM curriculum c
        JOIN subjects s ON c.subject_code = s.code
        WHERE LOWER(c.program) = $2 
        AND c.semester = $3
        AND c.year = $4
        ON CONFLICT (student_id, subject_id) DO NOTHING
        RETURNING subject_id
    `, [studentId, programKey, semester, year]);
}
