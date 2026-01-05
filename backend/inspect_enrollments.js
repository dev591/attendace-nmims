
import { query } from './db.js';

async function inspectEnrollments() {
    try {
        const t1 = await query('SELECT * FROM enrollments LIMIT 0');
        console.log('enrollments columns:', t1.fields.map(f => f.name));
    } catch (e) {
        console.log('enrollments table likely does not exist or error:', e.message);
    } finally {
        process.exit();
    }
}
inspectEnrollments();
