
import 'dotenv/config';
import { query } from './db.js';

async function fix() {
    console.log("🚀 MIGRATION: Fixing 'btech' -> 'Engineering'...");

    // 1. Update Students Table
    const res = await query(`
        UPDATE students 
        SET program = 'Engineering' 
        WHERE LOWER(program) = 'btech'
    `);

    console.log(`✅ Updated ${res.rowCount} student records to 'Engineering'.`);

    // 2. Re-trigger Auto-Enrollment (Bulk)
    console.log("🔄 Re-calculating enrollments for Engineering students...");

    // Delete existing enrollments for Engineering (to be safe/clean)
    await query(`
        DELETE FROM enrollments 
        WHERE student_id IN (SELECT student_id FROM students WHERE program = 'Engineering')
    `);

    // Insert new enrollments based on verify_global_fix logic
    const enrollRes = await query(`
        INSERT INTO enrollments (student_id, subject_id)
        SELECT DISTINCT s.student_id, sub.subject_id
        FROM students s
        JOIN curriculum c ON LOWER(c.program) = LOWER(s.program) AND c.year = s.year AND c.semester = s.semester
        JOIN subjects sub ON sub.code = c.subject_code
        WHERE s.program = 'Engineering'
    `);

    console.log(`✅ Created ${enrollRes.rowCount} new enrollments.`);
    process.exit();
}

fix();
