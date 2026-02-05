import { autoEnrollStudent } from './lib/enrollment_service.js';
import { query } from './db.js';

async function verifyFix() {
    console.log("🧪 VERIFYING ENGINEERING COMMON ENROLLMENT...");

    // 1. Create a specific test student (First Year Common)
    const testSapId = "TEST9999";
    const testStudentId = `STEST${Date.now()}`;

    // Cleanup first
    await query("DELETE FROM students WHERE sapid=$1", [testSapId]);

    // Insert Student (Program=Engineering, Dept=Engineering or Null)
    // Simulating the case from Import where it falls back to Program
    await query(`
        INSERT INTO students (student_id, sapid, name, program, dept, year, semester, password_hash)
        VALUES ($1, $2, 'Test Student', 'Engineering', 'Engineering', 1, 1, 'dummyhash123')
    `, [testStudentId, testSapId]);

    console.log(`👤 Created Test Student: ${testSapId} (Program=Engineering, Dept=Engineering)`);

    // 2. Trigger Auto Enroll
    const count = await autoEnrollStudent(testStudentId, 'Engineering', 'Engineering', 1, 1);

    if (count > 0) {
        console.log(`✅ SUCCESS! Student enrolled in ${count} subjects.`);
        // List them
        const res = await query(`
            SELECT s.code, s.name 
            FROM enrollments e 
            JOIN subjects s ON e.subject_id = s.subject_id 
            WHERE e.student_id = $1
        `, [testStudentId]);
        console.table(res.rows);
    } else {
        console.error("❌ FAILURE! No subjects enrolled.");

        // Debug: Check curriculum
        const curr = await query("SELECT * FROM curriculum WHERE lower(program)='engineering' AND year=1 AND semester=1");
        console.log("DEBUG: Available Curriculum for 'engineering' Y1 S1:", curr.rows.length);
        if (curr.rows.length > 0) console.table(curr.rows);
    }

    // Cleanup
    await query("DELETE FROM students WHERE sapid=$1", [testSapId]);
    process.exit();
}

verifyFix();
