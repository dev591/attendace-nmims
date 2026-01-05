/* ADDED BY ANTI-GRAVITY */
import { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function runMigration() {
    console.log("🚀 Starting Badge System Migration...");
    try {
        // 1. Create Tables
        const migrationSql = fs.readFileSync(path.join(__dirname, 'migration_badges.sql'), 'utf-8');
        await query(migrationSql);
        console.log("✅ Tables 'badges' and 'student_badges' created/verified.");

        // 2. Seed Data
        const seedSql = fs.readFileSync(path.join(__dirname, 'seed_badges.sql'), 'utf-8');
        await query(seedSql);
        console.log("✅ Seed data inserted.");

        console.log("🎉 Badge System Migration Complete!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Migration Failed:", e);
        process.exit(1);
    }
}

runMigration();
