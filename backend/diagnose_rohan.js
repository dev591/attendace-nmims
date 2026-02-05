
import { getClient } from './db.js';

async function diagnoseRohan() {
    const client = await getClient();
    try {
        console.log("=== Diagnosing Rohan Singh (SS9000011) ===");

        // 1. Get Student Profile
        const res = await client.query(`
            SELECT * FROM students WHERE student_id = 'SS9000011'
        `);
        if (res.rows.length === 0) {
            console.log("CRITICAL: Student SS9000011 not found in DB.");
            return;
        }
        const student = res.rows[0];
        console.log("Student Profile:");
        console.table({
            Name: student.name,
            SAPID: student.sapid,
            Section: student.section,
            Semester: student.semester,
            Program: student.program,
            School: student.school
        });

        // 2. Check Enrollments
        const enrollRes = await client.query(`
            SELECT e.*, s.name as subject_name 
            FROM enrollments e
            JOIN subjects s ON e.subject_id = s.subject_id
            WHERE e.student_id = 'SS9000011'
        `);
        console.log(`\nEnrollments: ${enrollRes.rowCount}`);
        if (enrollRes.rowCount > 0) {
            console.table(enrollRes.rows.map(r => ({ subject_id: r.subject_id, name: r.subject_name.substring(0, 20) })));
        } else {
            console.log("CRITICAL: Student has NO enrollments.");
        }

        // 3. Check Matching Sessions (by Section/Sem)
        // Sessions are linked by (program, semester, section) OR (program, semester, null_section) usually.
        // Let's check sessions that *should* match.
        const sessionQuery = `
            SELECT count(*) as total, 
                   min(date) as first_date, 
                   max(date) as last_date
            FROM sessions 
            WHERE school = $1 
            AND program = $2
            AND semester = $3
            AND (section = $4 OR section IS NULL)
        `;
        const params = [student.school, student.program, student.semester, student.section];

        const sessionRes = await client.query(sessionQuery, params);
        console.log("\nPotential Sessions (matching School/Prog/Sem/Sec):");
        console.table(sessionRes.rows);

        // 4. Check API-like Logic (Joined)
        // This simulates what the dashboard query usually does
        const apiQuery = `
            SELECT s.session_id, s.date, sub.name as subject_name
            FROM sessions s
            JOIN enrollments e ON s.subject_id = e.subject_id
            JOIN subjects sub ON s.subject_id = sub.subject_id
            WHERE e.student_id = 'SS9000011'
            AND s.date >= '2026-01-01'
            AND (s.section = $1 OR s.section IS NULL)
            ORDER BY s.date ASC
            LIMIT 5
        `;
        const apiRes = await client.query(apiQuery, [student.section]);
        console.log(`\nAPI Visible Sessions (Joined): ${apiRes.rowCount}`);
        if (apiRes.rowCount > 0) {
            console.table(apiRes.rows);
        } else {
            console.log("Why 0? Suggestions:");
            console.log("1. No sessions exist for this Section/Sem.");
            console.log("2. Student is not enrolled in the subjects that have sessions.");
            console.log("3. Sessions exist but date range or logic filters them out.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

diagnoseRohan();
