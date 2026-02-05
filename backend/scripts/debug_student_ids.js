
import { query } from '../db.js';

const debugStudentIds = async () => {
    try {
        console.log("--- Debugging Student IDs ---");

        // 1. Get a sample of students
        const res = await query(`
            SELECT student_id, sapid, name 
            FROM students 
            WHERE role = 'student' 
            LIMIT 10
        `);
        console.log("Student Samples:", res.rows);

        // 2. Check specific notifications for these samples
        if (res.rows.length > 0) {
            const firstId = res.rows[0].student_id;
            console.log(`Checking notifications for student_id: ${firstId}`);

            const notifs = await query(`
                SELECT id, title, created_at 
                FROM notifications 
                WHERE student_id = $1 
                LIMIT 5
            `, [firstId]);
            console.log("Notifications found:", notifs.rows);
        }

        process.exit(0);
    } catch (e) {
        console.error("Debug Error:", e);
        process.exit(1);
    }
};

debugStudentIds();
