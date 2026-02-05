import fs from 'fs';
import path from 'path';
import { getClient } from './db.js';

async function runMigration() {
    const client = await getClient();
    try {
        const sqlPath = path.join(process.cwd(), 'events_extension.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log("Applying Migration from:", sqlPath);

        await client.query(sql);
        console.log("✅ Migration Applied Successfully.");

        // Verification key check
        const res = await client.query("SELECT to_regclass('public.events')");
        console.log("Table Check:", res.rows[0]);

    } catch (e) {
        console.error("❌ Migration Failed:", e);
    } finally {
        client.release();
    }
}

runMigration();
