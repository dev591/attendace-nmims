/* ADDED BY ANTI-GRAVITY */
import { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });


async function runMigration() {
    console.log("🚀 Starting Quotes Migration...");
    try {
        // 1. Create Tables
        const migrationSql = fs.readFileSync(path.join(__dirname, 'migration_quotes.sql'), 'utf-8');
        await query(migrationSql);
        console.log("✅ Tables 'quotes' and 'daily_quote_cache' created/verified.");

        // 2. Seed Data
        // Check if data exists to avoid duplicates if re-run blindly, 
        // but the seed file uses simple INSERTs. We'll do a quick check.
        const check = await query('SELECT COUNT(*) FROM quotes');
        if (parseInt(check.rows[0].count) === 0) {
            const seedSql = fs.readFileSync(path.join(__dirname, 'seed_quotes.sql'), 'utf-8');
            await query(seedSql);
            console.log("✅ Seed data inserted.");
        } else {
            console.log("ℹ️ Quotes table already has data. Skipping seed.");
        }

        console.log("🎉 Migration Complete!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Migration Failed:", e);
        process.exit(1);
    }
}

runMigration();
