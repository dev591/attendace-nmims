
import { getClient } from './db.js';

async function inspect() {
    const client = await getClient();
    try {
        const tables = ['enrollments', 'attendance'];
        for (const t of tables) {
            const res = await client.query(`SELECT * FROM ${t} LIMIT 1`);
            console.log(`\n=== ${t} Columns ===`);
            if (res.rows.length > 0) {
                console.log(Object.keys(res.rows[0]));
            } else {
                // If table is empty, query schema
                const schemaRes = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = $1
                `, [t]);
                console.log(schemaRes.rows.map(r => r.column_name));
            }
        }
    } finally {
        client.release();
    }
}

inspect();
