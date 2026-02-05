
import { query } from './db.js';

const debug = async () => {
    try {
        console.log("--- Tables ---");
        const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(tables.rows.map(t => t.table_name).join(", "));

        console.log("\n--- Enrollments Columns ---");
        try {
            const cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'enrollments'");
            console.log(cols.rows.map(c => c.column_name).join(", "));
        } catch (e) { console.log("Enrollments table not found/error"); }

        console.log("\n--- Students ---");
        const studs = await query("SELECT student_id, sapid, name, course_id FROM students");
        console.log(studs.rows);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};

debug();
