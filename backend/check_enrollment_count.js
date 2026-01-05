
import 'dotenv/config';
import { query } from './db.js';

async function check() {
    const res = await query('SELECT count(*) FROM enrollments');
    console.log("Total Enrollments:", res.rows[0].count);

    const engRes = await query(`
        SELECT count(*) FROM enrollments e
        JOIN students s ON e.student_id = s.student_id
        WHERE s.program = 'Engineering'
    `);
    console.log("Engineering Enrollments:", engRes.rows[0].count);
    process.exit();
}
check();
