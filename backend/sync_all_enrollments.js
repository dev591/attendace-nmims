
import { query } from './db.js';
import { autoEnrollStudent } from './lib/enrollment_service.js';

async function syncAllEnrollments() {
    console.log("🔄 SYNCING ALL ENROLLMENTS...");

    // Get all students
    const res = await query("SELECT student_id, sapid, program, dept, year, semester FROM students");
    console.log(`Found ${res.rows.length} students.`);

    for (const s of res.rows) {
        // Default to engineering/1/1 if missing, but typically we trust DB
        const prog = s.program || 'Engineering';
        const dept = s.dept || 'Engineering';
        // Note: Our relaxed logic handles 'Engineering' dept correctly now

        try {
            await autoEnrollStudent(s.student_id, prog, dept, s.semester || 1, s.year || 1);
        } catch (e) {
            console.error(`Failed to sync ${s.sapid}: ${e.message}`);
        }
    }
    console.log("✅ Sync Complete.");
    process.exit();
}

syncAllEnrollments();
