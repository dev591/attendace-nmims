
import { query } from './db.js';
import { autoEnrollStudent } from './lib/enrollment_service.js';
import { getSubjectsForStudent } from './lib/subject_service.js';

async function verifyRandom() {
    console.log("🎲 VERIFYING 3 RANDOM STUDENTS...");

    // 1. Get 3 Random Students who have valid Year/Sem
    const res = await query(`
        SELECT student_id, sapid, program, dept, year, semester 
        FROM students 
        WHERE year IS NOT NULL AND semester IS NOT NULL
        ORDER BY RANDOM() 
        LIMIT 3
    `);

    if (res.rows.length === 0) {
        console.error("❌ No students found!");
        process.exit(1);
    }

    for (const student of res.rows) {
        console.log(`\n--------------------------------------------------`);
        console.log(`👤 Testing Student: ${student.sapid}`);
        console.log(`   Context: ${student.program} | ${student.dept} | Y${student.year} S${student.semester}`);

        try {
            // A. Force Clean (Simulate fresh state)
            await query('DELETE FROM enrollments WHERE student_id = $1', [student.student_id]);

            // B. Run Auto-Enrollment (The Code Under Test)
            // We pass raw program/dept just like the Login flow does
            const enrolledCount = await autoEnrollStudent(
                student.student_id,
                student.program,
                student.dept,
                student.semester,
                student.year
            );

            console.log(`   Enrollment Result: ${enrolledCount} subjects added.`);

            // C. Validate via Service check
            const serviceRes = await getSubjectsForStudent(student.sapid);
            const visibleSubjects = serviceRes.subjects.length;

            console.log(`   Visible Subjects:  ${visibleSubjects}`);

            if (visibleSubjects > 0 && enrolledCount > 0) {
                console.log(`   ✅ PASS: Student has subjects.`);
            } else {
                console.log(`   ❌ FAIL: Zero subjects found!`);

                // DIAGNOSTIC ON FAIL
                console.log(`   DEBUG: Why?`);
                // Check if curriculum exists for this logical key
                const rawProg = student.program || '';
                const rawBranch = student.dept || '';
                // We suspect the fix handles this, but let's log what we suspect
            }

        } catch (e) {
            console.error(`   ❌ CRASH: ${e.message}`);
        }
    }
    console.log(`\n--------------------------------------------------`);
    console.log("🎲 RANDOM VERIFICATION COMPLETE.");
    process.exit(0);
}

verifyRandom();
