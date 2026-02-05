
import { query } from '../db.js';

async function migrate() {
    try {
        console.log("Updating Role Constraint...");
        // 1. Drop existing constraint (name guessed from error: students_role_check)
        await query(`ALTER TABLE students DROP CONSTRAINT IF EXISTS students_role_check;`);

        // 2. Add new constraint including 'faculty'
        await query(`
            ALTER TABLE students 
            ADD CONSTRAINT students_role_check 
            CHECK (role IN ('student', 'admin', 'director', 'faculty'));
        `);

        console.log("✅ Role Constraint Updated");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration Failed:", err);
        process.exit(1);
    }
}

migrate();
