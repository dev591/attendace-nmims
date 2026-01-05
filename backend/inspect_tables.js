
import { query } from './db.js';

async function inspect() {
    try {
        const tables = ['timetable_master', 'curriculum', 'subjects', 'session_master'];
        for (const t of tables) {
            console.log(`\n--- ${t} ---`);
            const res = await query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [t]);
            console.table(res.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
inspect();
