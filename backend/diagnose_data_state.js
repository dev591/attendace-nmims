
import { getClient } from './db.js';

async function diagnose() {
    const client = await getClient();
    try {
        console.log("=== Database Diagnostic ===");

        // 1. Check Tables Counts
        const counts = {};
        const tables = ['students', 'subjects', 'sessions', 'enrollments', 'attendance', 'curriculum'];
        for (const t of tables) {
            const res = await client.query(`SELECT count(*) FROM ${t}`);
            counts[t] = res.rows[0].count;
        }
        console.table(counts);

        // 2. Check a sample student
        const studentRes = await client.query('SELECT sapid, name FROM students LIMIT 1');
        if (studentRes.rows.length === 0) {
            console.log("CRITICAL: No students found.");
            return;
        }
        const student = studentRes.rows[0];
        console.log(`\nSample Student: ${student.sapid} (${student.name})`);

        // 3. Check Enrollments for this student
        const enrollRes = await client.query('SELECT * FROM enrollments WHERE sapid = $1', [student.sapid]);
        console.log(`Enrollments for ${student.sapid}: ${enrollRes.rowCount}`);

        // 4. Check Sessions (Recent)
        const sessionRes = await client.query('SELECT * FROM sessions ORDER BY date DESC LIMIT 5');
        console.log(`\nRecent Sessions: ${sessionRes.rowCount}`);
        if (sessionRes.rowCount > 0) {
            console.log(sessionRes.rows.map(r => `${r.date} ${r.subject_id} ${r.status}`).join('\n'));
        }

        // 5. Check Attendance for this student
        const attRes = await client.query('SELECT * FROM attendance WHERE sapid = $1', [student.sapid]);
        console.log(`\nAttendance Records for ${student.sapid}: ${attRes.rowCount}`);
        if (attRes.rowCount > 0) {
            console.log(attRes.rows.slice(0, 5).map(r => `${r.date} ${r.status}`).join('\n'));
        } else {
            console.log("No attendance records found for this student. This explains why 'Session History' is empty.");
        }

    } catch (e) {
        console.error("Diagnostic Failed:", e);
    } finally {
        client.release();
    }
}

diagnose();
