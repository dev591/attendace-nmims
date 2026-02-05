
import { query } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

async function inspect() {
    try {
        const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'announcements'");
        console.log("Columns:", res.rows.map(r => r.column_name).join(', '));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
inspect();
