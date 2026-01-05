
import { query } from './db.js';

async function checkSchema() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'students'
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
checkSchema();
