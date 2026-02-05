
import { query } from './db.js';

async function migrate() {
    try {
        console.log("Applying Migration: Add Designation Column...");
        await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS designation TEXT;`);
        await query(`CREATE INDEX IF NOT EXISTS idx_students_role ON students(role);`);
        console.log("✅ Migration Successful");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration Failed:", err);
        process.exit(1);
    }
}

migrate();
