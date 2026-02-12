
import { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
    try {
        console.log("Applying Portfolio Schema fix...");
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'fix_portfolio_schema.sql'), 'utf8');
        await query(sql);
        console.log("✅ Schema update applied successfully.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Schema update failed:", e);
        process.exit(1);
    }
}

run();
