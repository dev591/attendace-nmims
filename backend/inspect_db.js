
import { getClient } from './db.js';

async function inspectSchema() {
    const client = await getClient();
    try {
        const tables = ['students', 'sessions', 'subjects', 'enrollments'];
        for (const t of tables) {
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [t]);
            console.log(`\nTABLE: ${t}`);
            console.table(res.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

inspectSchema();
