
import { query } from './db.js';
import crypto from 'crypto';

async function restoreData() {
    const studentId = 'S90020004';
    const sapid = '90020004';
    console.log(`Restoring Demo Data for ${studentId} (SAP: ${sapid})...`);

    try {
        // 1. Get Subjects (Should be 5 now)
        const enrollRes = await query('SELECT subject_id FROM enrollments WHERE student_id = $1', [studentId]);
        const subjects = enrollRes.rows.map(r => r.subject_id);

        console.log(`Found ${subjects.length} subjects.`);

        // 2. Insert Sessions (Past 5 Days)
        let inserted = 0;
        for (const sub of subjects) {
            for (let i = 1; i <= 5; i++) {
                // Date: i days ago
                const sessId = crypto.randomUUID();
                await query(`
                    INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, room, type)
                    VALUES ($1, $2, CURRENT_DATE - ${i}, '10:00:00', '11:00:00', 'VR', 'Lec')
                 `, [sessId, sub]);

                // 3. Mark Present (80% attendance)
                if (i !== 3) { // Miss one day
                    await query(`INSERT INTO attendance (session_id, student_id, present) VALUES ($1, $2, TRUE)`, [sessId, studentId]);
                } else {
                    await query(`INSERT INTO attendance (session_id, student_id, present) VALUES ($1, $2, FALSE)`, [sessId, studentId]);
                }
                inserted++;
            }
        }
        console.log(`✅ Data Restored (${inserted} sessions).`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
restoreData();
