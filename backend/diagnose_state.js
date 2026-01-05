
import { query } from './db.js';

async function diagnose() {
    try {
        console.log("=== DIAGNOSTIC REPORT ===");

        // 1. Check Badges
        const badges = await query('SELECT count(*) FROM badges');
        console.log(`Total Badges Defined: ${badges.rows[0].count}`);

        // 2. Check Enrollments for key users
        const users = ['S90020054', 'S90020004'];

        for (const uid of users) {
            const subRes = await query(`
                SELECT s.name, s.subject_id, s.program 
                FROM enrollments e 
                JOIN subjects s ON e.subject_id = s.subject_id 
                WHERE e.student_id = $1
             `, [uid]);

            console.log(`\nUser ${uid} Subjects (${subRes.rowCount}):`);
            if (subRes.rowCount > 0) {
                console.log(subRes.rows.map(r => `${r.subject_id} (${r.program})`).join(', '));
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
diagnose();
