
import 'dotenv/config';
import { query } from './db.js';

async function check() {
    console.log("🔍 Checking Curriculum Semester Distribution...");

    const res = await query(`
        SELECT program, year, semester, count(*) as subject_count
        FROM curriculum
        WHERE LOWER(program) = 'engineering'
        GROUP BY program, year, semester
        ORDER BY year, semester
    `);

    console.table(res.rows);
    process.exit();
}
check();
