
import { getClient } from './db.js';

async function checkRohan() {
    const client = await getClient();
    try {
        console.log("=== Diagnosing Rohan Khan ===");

        // 1. Find them again
        const res = await client.query("SELECT * FROM students WHERE name ILIKE '%Rohan Khan%' OR student_id LIKE 'SS900000%'");
        console.log(`Found ${res.rowCount} potential matches:`);

        for (const s of res.rows) {
            console.log(`\n-----------------------------------`);
            console.log(`Student: ${s.name} | ID: ${s.student_id} | SAP: ${s.sapid}`);
            console.log(`Scope: Sem ${s.semester} | Sec ${s.section} `);

            // 2. Check Enrollments
            const enr = await client.query("SELECT count(*) FROM enrollments WHERE student_id = $1", [s.student_id]);
            const count = parseInt(enr.rows[0].count);
            console.log(`▶ Enrollments: ${count}`);

            if (count === 0) {
                console.log("   ❌ WARNING: No subjects enrolled. Cannot see timetable.");
            } else {
                // 3. Check Sessions
                const timeline = await client.query(`
                    SELECT count(*) FROM sessions s 
                    JOIN enrollments e ON s.subject_id = e.subject_id 
                    WHERE e.student_id = $1
                 `, [s.student_id]);
                console.log(`   ▶ Visible Sessions: ${timeline.rows[0].count}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

checkRohan();
