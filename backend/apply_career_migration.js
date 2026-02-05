
import { query, getClient } from './db.js';

async function applyMigration() {
    const client = await getClient();
    try {
        console.log("Applying Career Copilot Migration...");

        // 1. Add Columns to students table
        const alterQueries = [
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE",
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS dream_company TEXT",
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS career_goal TEXT",
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS study_hours TEXT",
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS linkedin_url TEXT",
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS github_url TEXT"
        ];

        for (const q of alterQueries) {
            await client.query(q);
            console.log("Executed:", q);
        }

        // 2. Create daily_tasks table
        await client.query(`
            CREATE TABLE IF NOT EXISTS daily_tasks (
                id SERIAL PRIMARY KEY,
                student_id TEXT REFERENCES students(student_id),
                task_text TEXT NOT NULL,
                type TEXT NOT NULL, -- 'code', 'learn', 'project'
                is_completed BOOLEAN DEFAULT FALSE,
                date_assigned DATE DEFAULT CURRENT_DATE,
                metadata JSONB -- Store external links or specific IDs
            )
        `);
        console.log("Created table: daily_tasks");

        // 3. Create Index
        await client.query("CREATE INDEX IF NOT EXISTS idx_daily_tasks_student ON daily_tasks(student_id)");

        console.log("Migration Complete.");

    } catch (err) {
        console.error("Migration Failed:", err);
    } finally {
        client.release();
        process.exit();
    }
}

applyMigration();
