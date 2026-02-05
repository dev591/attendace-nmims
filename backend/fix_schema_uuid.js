
import { query } from './db.js';

async function migrate() {
    try {
        console.log("Applying Schema Fix for student_id...");

        // 1. Enable pgcrypto (for gen_random_uuid if needed, covering all bases)
        await query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

        // 2. Set Default Value
        // Note: IF student_id is TEXT/VARCHAR, we cast. If UUID, it works directly. 
        // Assuming current schema used text or uuid. 
        // We act generally.
        await query('ALTER TABLE students ALTER COLUMN student_id SET DEFAULT gen_random_uuid();');

        console.log("✅ Success: student_id now defaults to gen_random_uuid()");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration Failed:", err.message);
        process.exit(1);
    }
}

migrate();
