
import { getClient } from './db.js';

async function checkSessions() {
    const client = await getClient();
    try {
        console.log("--- DEBUGGING SESSIONS ---");

        // 1. Total Count
        const countRes = await client.query('SELECT count(*) FROM sessions');
        console.log(`Total Sessions in DB: ${countRes.rows[0].count}`);

        // 2. Date Range
        const rangeRes = await client.query('SELECT min(date), max(date) FROM sessions');
        console.log(`Date Range: ${rangeRes.rows[0].min} to ${rangeRes.rows[0].max}`);

        // 3. Sessions for JAN 2026
        const monthRes = await client.query(`
            SELECT date, count(*) 
            FROM sessions 
            WHERE date >= '2026-01-01' AND date <= '2026-01-31'
            GROUP BY date
            ORDER BY date ASC
        `);
        console.log("JAN 2026 Breakdown:");
        monthRes.rows.forEach(r => console.log(`${new Date(r.date).toISOString().split('T')[0]}: ${r.count} sessions`));

        // 4. Breakdown by Semester/Program
        const semRes = await client.query(`
            SELECT program, semester, count(*) 
            FROM sessions 
            GROUP BY program, semester 
            ORDER BY program, semester
        `);
        console.log("\nSession Distribution by Semester:");
        console.table(semRes.rows);

        // 5. List ALL unique Subject IDs in sessions
        const subRes = await client.query('SELECT DISTINCT subject_id FROM sessions LIMIT 10');
        console.log("Sample Scheduled Subjects:", subRes.rows.map(r => r.subject_id));

        // 4. Sample Raw Data (First 3)
        const rawRes = await client.query('SELECT * FROM sessions LIMIT 3');
        console.log("First 3 RAW Sessions:", JSON.stringify(rawRes.rows, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        client.release();
        process.exit();
    }
}

checkSessions();
