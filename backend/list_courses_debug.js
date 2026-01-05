
import { query } from './db.js';

async function listCourses() {
    const res = await query('SELECT * FROM courses');
    console.table(res.rows);
    process.exit();
}
listCourses();
