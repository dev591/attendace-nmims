import { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
    try {
        console.log('Applying Director Dashboard Migration...');
        const sqlPath = path.join(__dirname, 'migration_director_launch.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running SQL...');
        await query(sql);
        console.log('✅ Migration Applied Successfully!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Migration Failed:', e);
        process.exit(1);
    }
}

runMigration();
