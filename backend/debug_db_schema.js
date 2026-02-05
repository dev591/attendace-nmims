
import { query } from './db.js';

const debug = async () => {
    try {
        console.log("--- Enrollments Columns ---");
        const cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'enrollments'");
        console.log(cols.rows.map(c => c.column_name).join(", "));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};

debug();
