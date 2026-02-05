
import { query } from '../db.js';

async function up() {
    try {
        console.log("🚀 Creating 'achievements' table...");

        await query(`
            CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                student_id TEXT REFERENCES students(student_id),
                title TEXT NOT NULL,
                provider TEXT NOT NULL,
                type TEXT NOT NULL,
                date_completed DATE,
                proof_url TEXT NOT NULL,
                status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
                points INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Index for faster lookups by student and status
        await query(`CREATE INDEX IF NOT EXISTS idx_achievements_student ON achievements(student_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_achievements_status ON achievements(status)`);

        console.log("✅ 'achievements' table created successfully.");
    } catch (err) {
        console.error("❌ Migration Failed:", err);
    } finally {
        process.exit(0);
    }
}

up();
