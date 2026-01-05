
import { query } from './db.js';

async function diagnose() {
    const sapid = '90020004'; // S90020004
    console.log(`Diagnosing Curriculum Mismatch for SAPID: ${sapid}...`);

    try {
        // 1. Get Student Metadata
        const sRes = await query('SELECT student_id, sapid, program, semester, year, name FROM students WHERE sapid = $1', [sapid]);
        if (sRes.rows.length === 0) { console.log("Student not found!"); process.exit(); }
        const student = sRes.rows[0];
        console.log("\n[STUDENT DATA]");
        console.log(student);

        // 2. Get Raw Enrollments (What is in the table?)
        const eRes = await query(`
            SELECT s.subject_id, s.code, s.name 
            FROM enrollments e 
            JOIN subjects s ON e.subject_id = s.subject_id 
            WHERE e.student_id = $1
        `, [student.student_id]);

        console.log(`\n[RAW ENROLLMENTS] (Count: ${eRes.rowCount})`);
        console.log(eRes.rows);

        // 3. Check Curriculum for these subjects
        console.log("\n[CURRICULUM MATCH CHECK]");
        if (eRes.rowCount > 0) {
            const codes = eRes.rows.map(r => r.code);
            // Check if these codes exist in curriculum for THIS student's context
            const cRes = await query(`
                SELECT subject_code, program, semester, year 
                FROM curriculum 
                WHERE subject_code = ANY($1)
            `, [codes]);

            console.log(`Found ${cRes.rowCount} curriculum entries for these codes.`);
            cRes.rows.forEach(c => {
                const progMatch = (c.program.toLowerCase() === student.program.toLowerCase());
                const semMatch = (c.semester === student.semester);
                const yearMatch = (c.year === student.year);
                console.log(`Code: ${c.subject_code} | Prog: ${c.program} (${progMatch}) | Sem: ${c.semester} (${semMatch}) | Year: ${c.year} (${yearMatch})`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
diagnose();
