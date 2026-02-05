
import { getClient } from './db.js';

async function fixRohan() {
    const client = await getClient();
    try {
        console.log("=== Fixing Enrollments for Rohan Khan ===");

        const SOURCE_STUDENT = 'SS9000000'; // Vivaan (Has valid enrollments)
        const TARGET_STUDENTS = ['SS9000001', 'SS9000145']; // Rohan Khan(s)

        for (const target of TARGET_STUDENTS) {
            console.log(`\nProcessing ${target}...`);

            const res = await client.query(`
                INSERT INTO enrollments (student_id, subject_id)
                SELECT $1, subject_id
                FROM enrollments 
                WHERE student_id = $2
                ON CONFLICT (student_id, subject_id) DO NOTHING
                RETURNING subject_id
            `, [target, SOURCE_STUDENT]);

            console.log(`✅ Added ${res.rowCount} enrollments.`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

fixRohan();
