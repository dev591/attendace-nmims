
import { query } from './db.js';

async function checkSchema() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'faculty'
        `);
        console.log("Faculty Columns:", res.rows);
    } catch (e) {
        console.error(e);
    }
}

checkSchema();
