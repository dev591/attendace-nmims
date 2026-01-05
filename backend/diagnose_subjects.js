
import { query, getClient } from './db.js';

async function diagnose() {
    console.log("--- DIAGNOSTIC START ---");
    const client = await getClient();
    try {
        // 1. List all students
        const students = await client.query('SELECT student_id, sapid, name, program, year, semester, course_id FROM students');
        console.log(`Found ${students.rows.length} students.`);

        for (const s of students.rows) {
            console.log(`\nStudent: ${s.name} (${s.sapid})`);
            console.log(`  Program: '${s.program}', Year: ${s.year}, Sem: ${s.semester}, CourseID: ${s.course_id}`);

            // 2. Check Curriculum Match
            const curr = await client.query(`
                SELECT count(*) as count, string_agg(subject_code, ',') as codes 
                FROM curriculum 
                WHERE LOWER(program) = LOWER($1) AND year = $2 AND semester = $3
            `, [s.program, s.year, s.semester]);

            const c = curr.rows[0];
            console.log(`  Curriculum Match: ${c.count} subjects found.`);
            if (parseInt(c.count) === 0) {
                console.error(`  [ERROR] NO CURRICULUM FOUND FOR THIS STUDENT!`);
                // Check if program exists at all
                const progCheck = await client.query('SELECT DISTINCT program FROM curriculum');
                console.log(`  Available Programs in Curriculum: ${progCheck.rows.map(r => r.program).join(', ')}`);
            } else {
                console.log(`  Subjects: ${c.codes}`);
            }

            // 3. Check Enrollments (Legacy/Fallback)
            const enr = await client.query('SELECT count(*) as count FROM enrollments WHERE student_id = $1', [s.student_id]);
            console.log(`  Enrollments (Legacy): ${enr.rows[0].count}`);
        }

    } catch (e) {
        console.error("Diagnostic Error:", e);
    } finally {
        client.release();
        process.exit(); // key requirement
    }
}

diagnose();
