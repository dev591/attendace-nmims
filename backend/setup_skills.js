
import { query } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

async function setup() {
    try {
        console.log("🛠️ Creating student_skills table...");

        await query(`
            CREATE TABLE IF NOT EXISTS student_skills (
                id SERIAL PRIMARY KEY,
                student_id TEXT NOT NULL, 
                skill_name TEXT NOT NULL,
                category TEXT CHECK (category IN ('Tech', 'Soft', 'Domain')),
                endorsements INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_student FOREIGN KEY(student_id) REFERENCES students(student_id) ON DELETE CASCADE
            );
        `);

        console.log("✅ student_skills table created.");

        // Add an index for faster lookups
        await query(`CREATE INDEX IF NOT EXISTS idx_skills_student ON student_skills(student_id);`);
        await query(`CREATE INDEX IF NOT EXISTS idx_skills_name ON student_skills(skill_name);`);
        console.log("✅ Indexes created.");

        process.exit(0);
    } catch (err) {
        console.error("❌ Setup failed:", err);
        process.exit(1);
    }
}

setup();
