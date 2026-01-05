
import { query } from './db.js';

async function diagnose() {
    try {
        console.log("=== DIAGNOSTIC REPORT V2 ===");

        // 1. Inspect Subject Schema
        try {
            const subSample = await query('SELECT * FROM subjects LIMIT 1');
            console.log("Subject Columns:", Object.keys(subSample.rows[0]));
        } catch (e) { console.log("Subject Schema Check Failed"); }

        // 2. Check Enrollments for key users (SAFE QUERY)
        const users = ['S90020054', 'S90020004'];

        for (const uid of users) {
            const subRes = await query(`
                SELECT s.name, s.subject_id
                FROM enrollments e 
                JOIN subjects s ON e.subject_id = s.subject_id 
                WHERE e.student_id = $1
             `, [uid]);

            console.log(`\nUser ${uid} Subjects (${subRes.rowCount}):`);
            // console.log(subRes.rows.map(r => r.subject_id).join(', '));
            // Don't print all if too many, just count
            if (subRes.rowCount > 0) {
                console.log(subRes.rows.map(r => `${r.subject_id} - ${r.name}`).join('\n'));
            }
        }

        // 3. Check Badges Table
        const bRes = await query('SELECT code FROM badges');
        console.log("\nBadges Defined:", bRes.rows.map(b => b.code));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
diagnose();
