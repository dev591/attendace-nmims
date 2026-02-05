
import { query } from '../db.js';

async function migrate() {
    try {
        console.log("🚀 Creating 'appeals' table...");

        await query(`
            CREATE TABLE IF NOT EXISTS appeals (
                id SERIAL PRIMARY KEY,
                student_id TEXT REFERENCES students(student_id),
                school_code TEXT NOT NULL, 
                type TEXT NOT NULL,
                description TEXT,
                proof_url TEXT NOT NULL,
                status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Index for fast director lookups by school
        await query(`CREATE INDEX IF NOT EXISTS idx_appeals_school_code ON appeals(school_code);`);
        await query(`CREATE INDEX IF NOT EXISTS idx_appeals_student_id ON appeals(student_id);`);

        console.log("✅ 'appeals' table created successfully.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Migration failed:", e);
        process.exit(1);
    }
}

migrate();
