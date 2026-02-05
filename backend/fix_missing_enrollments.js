
import { query } from './db.js';
import { autoEnrollStudent } from './lib/enrollment_service.js';

async function fixMissingEnrollments() {
    console.log("🛠 STARTING BATCH FIX FOR MISSING ENROLLMENTS...");

    // 1. Find students with 0 enrollments
    const res = await query(`
        SELECT s.student_id, s.sapid, s.program, s.dept, s.year, s.semester 
        FROM students s
        LEFT JOIN enrollments e ON s.student_id = e.student_id
        WHERE e.student_id IS NULL
    `);

    if (res.rows.length === 0) {
        console.log("✅ No students found with missing enrollments.");
        process.exit(0);
    }

    console.log(`found ${res.rows.length} students with no subjects. Attempting fix...`);

    let successCount = 0;
    let failCount = 0;

    for (const student of res.rows) {
        try {
            // map dept=null or 'engineering' handled by service now
            const count = await autoEnrollStudent(
                student.student_id,
                student.program || 'Engineering',
                student.dept || 'Engineering',
                student.semester || 1,
                student.year || 1
            );

            if (count > 0) {
                console.log(`[FIXED] Student ${student.sapid}: Enrolled in ${count} subjects.`);
                successCount++;
            } else {
                console.warn(`[SKIPPED] Student ${student.sapid}: Still 0 subjects found.`);
                failCount++;
            }
        } catch (err) {
            console.error(`[ERROR] Failed to fix ${student.sapid}:`, err.message);
            failCount++;
        }
    }

    console.log(`\n🎉 BATCH FIX COMPLETE.`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed/Skipped: ${failCount}`);
    process.exit(0);
}

fixMissingEnrollments();
