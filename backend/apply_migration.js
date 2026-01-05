import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    try {
        console.log("🔌 Connecting to DB...");
        const client = await pool.connect();
        try {
            console.log("🛠️ Applying schema updates...");

            // 5. Add Semester Support
            console.log("Applying 005_add_semester.sql...");
            const migration5 = fs.readFileSync(path.join(__dirname, 'migrations', '005_add_semester.sql'), 'utf8');
            await client.query(migration5);

            // 1. Add type/room to sessions (Verified)
            await client.query("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Lecture';");
            await client.query("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS room TEXT;");

            // 2. Ensure students have password columns (Verified)
            await client.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS password_hash TEXT;");
            await client.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS must_set_password BOOLEAN DEFAULT FALSE;");

            // 3. Create Curriculum Table (NEW)
            await client.query(`
                CREATE TABLE IF NOT EXISTS curriculum (
                    id SERIAL PRIMARY KEY,
                    program TEXT NOT NULL,
                    year INT NOT NULL,
                    subject_code TEXT NOT NULL,
                    subject_name TEXT NOT NULL,
                    total_classes INT NOT NULL DEFAULT 40,
                    min_attendance_pct INT NOT NULL DEFAULT 80,
                    UNIQUE(program, year, subject_code)
                );
            `);
            console.log("✅ Curriculum table ready!");

            console.log("✅ Schema updated successfully!");
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("❌ Migration failed:", e.message);
    } finally {
        await pool.end();
    }
}

runMigration();
