
import { query } from './db.js';

const check = async () => {
    try {
        console.log("Checking S001 enrollments...");
        const res = await query("SELECT count(*) FROM enrollments WHERE student_id = 'S001'");
        console.log(`Count: ${res.rows[0].count}`);

        const rows = await query("SELECT * FROM enrollments WHERE student_id = 'S001'");
        console.log(rows.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
