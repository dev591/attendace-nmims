
import { query } from './db.js';
import { autoEnrollStudent } from './lib/enrollment_service.js';

async function fixPrograms() {
    console.log("🛠 Standardizing Program Names (Bypassing FK)...");

    // 1. Update B.Tech -> Engineering (ONLY PROGRAM COLUMN)
    const res = await query(`
        UPDATE students 
        SET program = 'Engineering'
        WHERE LOWER(program) LIKE 'b.tech%' OR LOWER(program) = 'engineering'
        RETURNING student_id, name, program
    `);

    console.log(`✅ Normalized ${res.rows.length} engineering students.`);

    // 2. Re-enroll S001 specifically to check success
    // const s001 = res.rows.find(s => s.student_id === 'S001'); // S001 might already be 'Engineering' so it might not be returned if I run it twice?
    // Actually, force run it for S001 regardless.

    console.log("🔄 Re-enrolling Dev Chalana (S001)...");
    const count = await autoEnrollStudent('S001', 'Engineering', 1, 1);
    console.log(`Enrollment Refreshed: ${count} subjects.`);

    // 3. Also fix uuid-test-001 just in case
    console.log("🔄 Re-enrolling Test Student (uuid-test-001)...");
    await autoEnrollStudent('uuid-test-001', 'Engineering', 1, 1);

    process.exit();
}
fixPrograms();
