
import { query } from './db.js';
import { autoEnrollStudent } from './lib/enrollment_service.js';

async function fixAll() {
    console.log("🚀 Starting Global Enrollment Cleanup...");
    try {
        // 1. Get all students
        const res = await query('SELECT student_id, name, program, year, semester FROM students');
        const students = res.rows;

        console.log(`Processing ${students.length} students...`);
        let fixedCount = 0;

        for (const s of students) {
            // console.log(`Processing ${s.name} (${s.program} Y${s.year} S${s.semester})...`);

            // Validate context (skip incomplete records)
            if (!s.program || !s.year || !s.semester) {
                console.warn(`⚠️ Skipping ${s.name} - Missing academic context.`);
                continue;
            }

            // Run strict auto-enrollment
            const count = await autoEnrollStudent(s.student_id, s.program, s.semester, s.year);
            if (count > 0) fixedCount++;
        }

        console.log(`\n✅ Global Fix Complete! Processed ${fixedCount} valid enrollments.`);

    } catch (e) {
        console.error("❌ Global Fix Failed:", e);
    } finally {
        process.exit();
    }
}
fixAll();
