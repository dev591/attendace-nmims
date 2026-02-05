
import { getClient } from './db.js';

async function findWorkingStudent() {
    const client = await getClient();
    try {
        console.log("=== Searching for a WORKING Test User ===");

        // 1. Find a student in Semester 4, Section A (since we know sessions exist there)
        const res = await client.query(`
            SELECT s.sapid, s.name, s.semester, s.section, count(e.id) as enroll_count
            FROM students s
            JOIN enrollments e ON s.sapid = e.student_id
            WHERE s.semester = 4 AND s.section = 'A'
            GROUP BY s.sapid, s.name, s.semester, s.section
            ORDER BY enroll_count DESC
            LIMIT 1
        `);

        if (res.rows.length === 0) {
            console.log("No enrolled students found in Sem 4 Sec A.");
            // Try lenient search
            const anyStudent = await client.query(`SELECT sapid, semester, section FROM students WHERE semester = 4 AND section = 'A' LIMIT 1`);
            if (anyStudent.rows.length > 0) {
                console.log(`Found student ${anyStudent.rows[0].sapid} in Sem 4 Sec A but they have NO enrollments.`);
            }
            return;
        }

        const target = res.rows[0];
        console.log(`\n✅ FOUND VALID USER:`);
        console.log(`SAP ID: ${target.sapid}`);
        console.log(`Name:   ${target.name}`);
        console.log(`Sem:    ${target.semester}`);
        console.log(`Sec:    ${target.section}`);
        console.log(`Enrollments: ${target.enroll_count}`);

        // 2. Verify Sessions for this user
        // We need to check if they have sessions for their enrolled subjects
        const sessionCheck = await client.query(`
            SELECT count(*) 
            FROM sessions s
            JOIN enrollments e ON s.subject_id = e.subject_id
            WHERE e.student_id = $1
            AND s.date >= CURRENT_DATE
        `, [target.sapid]);

        console.log(`Upcoming Sessions: ${sessionCheck.rows[0].count}`);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

findWorkingStudent();
