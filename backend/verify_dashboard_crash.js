
import { getClient } from './db.js';
import fetch from 'node-fetch';

async function verifyDashboard() {
    const userId = 'SS9000000'; // Vivaan
    // We need a valid token to hit the endpoint, or we mock the internal function.
    // It's easier to mock internal calls if we don't have a token generator handy (though we do in index.js).
    // Let's rely on reading the internal logic via database state.

    // Actually, let's just run the internal `getStudentAnalyticsOverview` logic effectively since that's likely where it breaks.
    // But index.js logic is complex.

    // Let's try to 'simulate' the dashboard logic by running the queries manually.
    const client = await getClient();
    try {
        console.log("=== Verifying Dashboard Queries ===");

        // 1. Get Analytics
        // The dashboard calls `recomputeAnalyticsForStudent` (wrapper) or `getStudentAnalyticsOverview`.
        // Let's assume `getStudentAnalyticsOverview`.

        const enrollments = await client.query('SELECT * FROM enrollments WHERE student_id = $1', [userId]);
        console.log(`Enrollments: ${enrollments.rowCount}`);
        if (enrollments.rowCount === 0) {
            console.log("User has no enrollments. Dashboard might panic if it expects some?");
        }

        // 2. Check Sessions count (Should be 0 now)
        const sessions = await client.query('SELECT count(*) FROM sessions');
        console.log(`Sessions Total: ${sessions.rows[0].count}`);

        // 3. Timetable Query (from index.js)
        const timetableRes = await client.query(`
             SELECT
                s.name as subject_name,
                ses.date
             FROM sessions ses
             JOIN subjects s ON ses.subject_id = s.subject_id
             JOIN enrollments e ON s.subject_id = e.subject_id
             WHERE e.student_id = $1
             AND ses.date >= CURRENT_DATE 
             LIMIT 5
        `, [userId]);
        console.log(`Timetable Query: ${timetableRes.rowCount} rows`);

    } catch (e) {
        console.error("Query Failed:", e);
    } finally {
        client.release();
    }
}

verifyDashboard();
