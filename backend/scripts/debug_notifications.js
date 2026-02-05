
import { query } from '../db.js';

const debugNotifications = async () => {
    try {
        console.log("--- Debugging Notifications ---");

        // 1. Check last 5 notifications created
        const res = await query(`
            SELECT id, student_id, title, created_at, is_global 
            FROM notifications 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log("Last 5 Notifications:", res.rows);

        // 2. Check last 5 announcements
        const ann = await query(`
            SELECT id, title, target_group, created_at 
            FROM announcements 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log("Last 5 Announcements:", ann.rows);

        // 3. Count students
        const count = await query("SELECT count(*) FROM students WHERE role='student'");
        console.log("Total Students:", count.rows[0].count);

        process.exit(0);
    } catch (e) {
        console.error("Debug Error:", e);
        process.exit(1);
    }
};

debugNotifications();
