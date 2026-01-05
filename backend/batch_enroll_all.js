
import { query } from './db.js';
import { autoEnrollStudent } from './lib/enrollment_service.js';

async function batchEnrollAll() {
    console.log("🚀 BATCH ENROLLMENT STARTED: Applying Strict Fix to ALL Students...");

    // Fetch all Active Students (with year/sem)
    const res = await query(`
        SELECT student_id, sapid, program, dept, year, semester 
        FROM students 
        WHERE year IS NOT NULL AND semester IS NOT NULL
        ORDER BY sapid ASC
    `);

    console.log(`📋 Found ${res.rows.length} students to enrollment-check.`);

    let successCount = 0;
    let failCount = 0;
    let zeroCount = 0;

    for (const student of res.rows) {
        try {
            // Force re-enrollment logic for everyone
            const count = await autoEnrollStudent(
                student.student_id,
                student.program,
                student.dept,
                student.semester,
                student.year
            );

            if (count > 0) {
                // Determine if this was a "fix" (user had 0 before?) - hard to know cheaply, but positive count is good.
                successCount++;
                if (successCount % 100 === 0) process.stdout.write('.');
            } else {
                zeroCount++;
            }
        } catch (e) {
            // Logs are already handled in service, but we count failures
            if (e.message !== "BRANCH_REQUIRED_FOR_ENROLLMENT") {
                console.error(`❌ Unexpected Fail: ${student.sapid} - ${e.message}`);
            }
            failCount++;
        }
    }

    console.log(`\n\n🏁 BATCH ENROLLMENT COMPLETE.`);
    console.log(`✅ Enrolled Subjects: ${successCount} students`);
    console.log(`ℹ️ Zero Subjects:    ${zeroCount} students (Might be valid if no curriculum yet)`);
    console.log(`❌ Failed/Skipped:   ${failCount} students (Likely Missing Branch)`);

    if (successCount > 0) {
        console.log("\n✅ FIX PROPAGATED: All valid students should now see subjects on reload.");
    }

    process.exit();
}

batchEnrollAll();
