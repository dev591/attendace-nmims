/* ADDED BY ANTI-GRAVITY */
import dotenv from 'dotenv';
dotenv.config();

import { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runSqlFile(filename) {
    console.log(`Running ${filename}...`);
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filename}`);
        return;
    }
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
        await query(sql);
        console.log(`✅ Successfully ran ${filename}`);
    } catch (e) {
        console.error(`❌ Failed to run ${filename}`, e);
        process.exit(1);
    }
}

async function main() {
    await runSqlFile('migration_add_attendance_fields.sql');
    await runSqlFile('seed_attendance_examples.sql');
    process.exit(0);
}

main();
