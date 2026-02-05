
import { query } from './db.js';

const SAPID = '590000104';

async function verifyStudentData() {
    console.log(`\n🔍 VERIFYING DATA FOR SAPID: ${SAPID}\n`);

    try {
        // 1. Check Student Profile
        const studentRes = await query('SELECT * FROM students WHERE sapid = $1', [SAPID]);
        if (studentRes.rows.length === 0) {
            console.error("❌ STUDENT NOT FOUND IN DB");
            return;
        }
        const student = studentRes.rows[0];
        console.log("✅ Student Found:", {
            id: student.student_id,
            name: student.name,
            program: student.program,
            course_id: student.course_id
        });

        // 2. Check Enrollments
        const enrollRes = await query(`
            SELECT e.enrollment_id, s.code, s.name 
            FROM enrollments e
            JOIN subjects s ON e.subject_id = s.subject_id
            WHERE e.student_id = $1
        `, [student.student_id]);

        console.log(`\n📚 Enrollments (${enrollRes.rows.length}):`);
        if (enrollRes.rows.length === 0) console.log("   --> ⚠️ NO SUBJECTS ENROLLED");
        enrollRes.rows.forEach(r => console.log(`   - ${r.code}: ${r.name}`));

        // 3. Check Attendance
        const attRes = await query(`
            SELECT a.session_id, a.present, s.date, sub.code
            FROM attendance a
            JOIN sessions s ON a.session_id = s.session_id
            JOIN subjects sub ON s.subject_id = sub.subject_id
            WHERE a.student_id = $1
            ORDER BY s.date DESC
            LIMIT 5
        `, [student.student_id]);

        console.log(`\n📅 Recent Attendance (${attRes.rows.length}):`);
        if (attRes.rows.length === 0) console.log("   --> ⚠️ NO ATTENDANCE RECORDS");
        attRes.rows.forEach(r => console.log(`   - ${r.date.toISOString().split('T')[0]}: ${r.code} (${r.present ? 'Present' : 'Absent'})`));

        process.exit(0);

    } catch (e) {
        console.error("Fatal Error:", e);
        process.exit(1);
    }
}

verifyStudentData();
