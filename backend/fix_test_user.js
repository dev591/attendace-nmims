
import { getClient } from './db.js';

async function fixTestUser() {
    const client = await getClient();
    try {
        const TEST_USER = 'SS9000000'; // Vivaan Malhotra (Internal ID)
        console.log(`=== Fixing User ${TEST_USER} ===`);

        // 1. Find Subjects that actually have sessions created
        const subjectsRes = await client.query(`
            SELECT DISTINCT s.subject_id, sub.name
            FROM sessions s
            JOIN subjects sub ON s.subject_id = sub.subject_id
            WHERE s.semester = 4 
            AND s.section = 'A'
            LIMIT 5
        `);

        if (subjectsRes.rows.length === 0) {
            console.log("CRITICAL: No sessions found for Sem 4 Sec A. Cannot enroll.");
            return;
        }

        const subjects = subjectsRes.rows;
        console.log(`Found ${subjects.length} active subjects:`, subjects.map(s => s.name));

        // 2. Enroll User
        for (const sub of subjects) {
            await client.query(`
                INSERT INTO enrollments (student_id, subject_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `, [TEST_USER, sub.subject_id]);
        }
        console.log("✅ Enrolled user into these subjects.");

        // 3. Verify
        const check = await client.query(`
            SELECT count(*) FROM sessions s
            JOIN enrollments e ON s.subject_id = e.subject_id
            WHERE e.student_id = $1
        `, [TEST_USER]);

        console.log(`\n🎉 User ${TEST_USER} now resolves to ${check.rows[0].count} sessions!`);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

fixTestUser();
