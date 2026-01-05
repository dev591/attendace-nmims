
import { query } from './db.js';

async function inspect() {
    try {
        const t1 = await query('SELECT * FROM course_subjects LIMIT 0');
        console.log('course_subjects columns:', t1.fields.map(f => f.name));

        const t2 = await query('SELECT * FROM curriculum LIMIT 0');
        console.log('curriculum columns:', t2.fields.map(f => f.name));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
inspect();
