
import { getClient } from './db.js';

async function diagnose() {
    const client = await getClient();
    try {
        console.log("=== Database Diagnostic V2 ===");

        // 1. Check Student ID Schema
        const studentRes = await client.query('SELECT pk_student_id, sapid, name FROM students LIMIT 5');
        const students = studentRes.rows;
        if (students.length === 0) { console.log("No students."); return; }

        // Lets assume pk_student_id is the foreign key used? or sapid?
        // Let's check enrollments content
        const enrollSample = await client.query('SELECT * FROM enrollments LIMIT 5');
        console.log("\nEnrollment Sample:", enrollSample.rows);

        const sampleSapid = students[0].sapid;
        console.log(`\nChecking for Student SAPID: ${sampleSapid}`);

        // 2. Check Enrollments for this SAPID
        // We need to guess if student_id in enrollments refers to sapid or pk_student_id
        // Usually likely sapid if it's a string, or pk if int.

        let enrolled = await client.query('SELECT * FROM enrollments WHERE student_id = $1', [sampleSapid]);
        console.log(`Enrollments (using SAPID): ${enrolled.rowCount}`);

        if (enrolled.rowCount === 0) {
            // Try using pk
            // Need to find what pk is. 
            // If students table doesn't have pk_student_id explicitly named that, I should check schema.
            // But let's assume standard 'id' or similar if previous output didn't show all columns.
        }

        // 3. Check Sessions Dates
        const sessionsRes = await client.query(`
            SELECT count(*) as count, status, MIN(date) as earliest, MAX(date) as latest 
            FROM sessions 
            GROUP BY status
        `);
        console.log("\nSession Summary:");
        console.table(sessionsRes.rows);

        // 4. Check if we have past sessions that are NOT in attendance
        // If sessions are 'conducted' but attendance is empty, that's the issue.
        const pastSessions = await client.query(`
            SELECT * FROM sessions WHERE date < CURRENT_DATE LIMIT 5
        `);
        console.log(`\nPast Sessions Sample: ${pastSessions.rowCount} found`);
        if (pastSessions.rowCount > 0) {
            console.log(pastSessions.rows.map(s => `${s.session_id} [${s.date}] ${s.status}`).join('\n'));
        }

    } finally {
        client.release();
    }
}

diagnose();
