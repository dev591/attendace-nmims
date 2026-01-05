
import { query } from '../db.js';

// NUCLEAR CLEANUP SCRIPT
// Strict Enforcement: A student can ONLY be enrolled in subjects that match their
// CURRENT Program + Year + Semester in the Curriculum table.
// Any other enrollment in `course_subjects` is considered a "Leak" and will be deleted.

async function verifyAndClean() {
    console.log("🔥 STARTING NUCLEAR CLEANUP: Enforcing Curriculum Truth 🔥");

    try {
        // 1. Get all students
        const { rows: students } = await query('SELECT student_id, program, year, semester FROM students');
        console.log(`Checking enrollments for ${students.length} students...`);

        let totalDeleted = 0;

        for (const student of students) {
            // 2. Get VALID subjects from Curriculum -> Subjects map
            const { rows: validCurriculum } = await query(`
                SELECT s.subject_id, c.subject_code 
                FROM curriculum c
                JOIN subjects s ON lower(s.code) = lower(c.subject_code)
                WHERE lower(c.program) = lower($1) AND c.year = $2 AND c.semester = $3
            `, [student.program, student.year, student.semester]);

            if (validCurriculum.length === 0) {
                console.warn(`⚠️  Student ${student.student_id} (${student.program} Y${student.year} S${student.semester}) has NO curriculum defined! Skipping...`);
                continue;
            }

            const validSubjectIds = validCurriculum.map(c => c.subject_id);

            // 3. Find INVALID enrollments in 'enrollments' table
            // We select current enrollments that are NOT in the valid list
            const { rows: invalidEnrollments } = await query(`
                SELECT id, subject_id 
                FROM enrollments 
                WHERE student_id = $1 AND NOT (subject_id = ANY($2))
            `, [student.student_id, validSubjectIds]);

            if (invalidEnrollments.length > 0) {
                const idsToDelete = invalidEnrollments.map(e => e.id);
                console.log(`❌ Student ${student.student_id}: Found ${invalidEnrollments.length} LEAKED subjects in 'enrollments'. Deleting...`);

                // 4. DELETE
                for (const inv of invalidEnrollments) {
                    await query('DELETE FROM enrollments WHERE id = $1', [inv.id]);
                }
                totalDeleted += invalidEnrollments.length;
            }
        }

        console.log("------------------------------------------------");
        console.log(`✅ SCAN COMPLETE. Deleted ${totalDeleted} invalid subject enrollments.`);
        console.log("Run this script whenever 'subject leak' is reported.");

    } catch (e) {
        console.error("Cleanup Failed:", e);
    } finally {
        process.exit();
    }
}

verifyAndClean();
