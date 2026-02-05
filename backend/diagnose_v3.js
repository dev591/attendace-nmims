
import { getClient } from './db.js';

async function diagnose() {
    const client = await getClient();
    try {
        console.log("=== Database Diagnostic V3 ===");

        // 1. Check Student Columns
        const studentRes = await client.query('SELECT * FROM students LIMIT 1');
        console.log("Student Columns:", Object.keys(studentRes.rows[0]));
        const sampleStudent = studentRes.rows[0];
        console.log("Sample Student:", sampleStudent);

        // 2. Check Enrollments for this student (using sapid or student_id)
        // Check what column 'student_id' in enrollments matches
        const enrollCheck = await client.query('SELECT * FROM enrollments LIMIT 1');
        if (enrollCheck.rows.length > 0) {
            console.log("Enrollment Sample:", enrollCheck.rows[0]);
            // Do the values look like SAPIDs (S...) or UUIDs/Integers?
        }

        // 3. Check Sessions Logic
        // Are there sessions before today (2026-01-07)?
        const today = '2026-01-07';
        const pastSessions = await client.query(`
            SELECT count(*) 
            FROM sessions 
            WHERE date < $1
        `, [today]);
        console.log(`Sessions before ${today}: ${pastSessions.rows[0].count}`);

        const conductedSessions = await client.query(`
            SELECT count(*) FROM sessions WHERE status = 'conducted'
        `);
        console.log(`Sessions marked 'conducted': ${conductedSessions.rows[0].count}`);

        // 4. Check Attendance Table
        const attCount = await client.query('SELECT count(*) FROM attendance');
        console.log(`Total Attendance Records: ${attCount.rows[0].count}`);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

diagnose();
