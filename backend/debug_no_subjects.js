
import { query } from './db.js';
import { normalizeProgram, normalizeBranch } from './lib/program_branch_mapper.js';

async function debugNoSubjects() {
    const SAPID = "90030002"; // The user's ID
    console.log(`🕵️‍♀️ DEBUG DATA FOR: ${SAPID}`);

    // 1. Student Fetch
    const sRes = await query("SELECT * FROM students WHERE sapid=$1", [SAPID]);
    if (sRes.rows.length === 0) {
        console.error("❌ Student not found in DB.");
        return;
    }
    const student = sRes.rows[0];
    console.log("👤 Student Record:", {
        sapid: student.sapid,
        program: student.program,
        dept: student.dept,
        year: student.year,
        semester: student.semester
    });

    // 2. Key Calculation (Mimic Enrollment Service)
    const normProg = normalizeProgram(student.program);
    const normBranch = normalizeBranch(student.dept);
    const effectiveKey = `${normProg.toLowerCase()}-${normBranch ? normBranch.toLowerCase() : 'null'}`;

    console.log(`🔑 Calculated Enrollment Key: '${effectiveKey}'`);

    // 3. Curriculum Check
    const cRes = await query(`
        SELECT count(*), json_agg(subject_code) as codes
        FROM curriculum 
        WHERE LOWER(program) = $1 AND year = $2 AND semester = $3
    `, [effectiveKey, student.year, student.semester]);

    console.log("📚 Curriculum Matches:", cRes.rows[0]);

    if (parseInt(cRes.rows[0].count) === 0) {
        console.error(`❌ NO CURRICULUM found for key '${effectiveKey}' Y${student.year} S${student.semester}`);
        console.log("   Suggestion: Check if curriculum table has this program key or if keys are mismatching (e.g. 'engineering-DS' vs 'engineering-ds').");

        // Debug Tip: List distinct programs in curriculum
        const dist = await query("SELECT DISTINCT program FROM curriculum WHERE program LIKE 'engineering%'");
        console.log("   Available Engineering Keys in DB:", dist.rows.map(r => r.program));
    }

    // 4. Enrollments Check
    const eRes = await query("SELECT count(*) FROM enrollments WHERE student_id = $1", [student.student_id]);
    console.log(`📝 Actual Enrollments in DB: ${eRes.rows[0].count}`);

    process.exit();
}

debugNoSubjects();
