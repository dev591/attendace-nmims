
import { getClient } from './db.js';

async function checkStudent() {
    const client = await getClient();
    try {
        const SAPID = 'S90012023';
        console.log(`Checking for SAPID: ${SAPID}`);

        const res = await client.query("SELECT * FROM students WHERE sapid = $1", [SAPID]);
        if (res.rows.length === 0) {
            console.log("❌ Student NOT FOUND");
        } else {
            console.log("✅ Student Found:", res.rows[0]);
            const studentId = res.rows[0].student_id;

            // Check Enrollments
            const enrolRes = await client.query("SELECT count(*) FROM enrollments WHERE student_id = $1", [studentId]);
            console.log(`Enrollments: ${enrolRes.rows[0].count}`);

            if (enrolRes.rows[0].count > 0) {
                const subRes = await client.query(`
                    SELECT s.subject_id, s.name, s.total_classes, s.code 
                    FROM enrollments e 
                    JOIN subjects s ON e.subject_id = s.subject_id 
                    WHERE e.student_id = $1
                `, [studentId]);
                console.log("Subjects:", subRes.rows);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

checkStudent();
