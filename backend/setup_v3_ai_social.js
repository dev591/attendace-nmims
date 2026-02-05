
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
import { query } from './db.js';

async function applySchema() {
    console.log("--- Applying AI & Social Schema Updates ---");

    try {
        // 1. Social Connections Table
        console.log("Creating 'connections' table...");
        await query(`
            CREATE TABLE IF NOT EXISTS connections (
                id SERIAL PRIMARY KEY,
                requester_id TEXT REFERENCES students(student_id),
                receiver_id TEXT REFERENCES students(student_id),
                status TEXT DEFAULT 'pending', -- 'pending', 'accepted'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(requester_id, receiver_id)
            );
        `);

        // 2. Daily Tasks Table (AI Generated)
        console.log("Creating 'daily_tasks' table...");
        await query(`
            CREATE TABLE IF NOT EXISTS daily_tasks (
                id SERIAL PRIMARY KEY,
                student_id TEXT REFERENCES students(student_id),
                task_text TEXT NOT NULL,
                type TEXT NOT NULL, -- 'code', 'learn', 'project', 'soft-skill'
                is_completed BOOLEAN DEFAULT FALSE,
                assigned_date DATE DEFAULT CURRENT_DATE,
                xp_reward INT DEFAULT 10
            );
        `);

        // 3. AI Usage & Caching (Scalability)
        console.log("Creating 'ai_response_cache' table...");
        await query(`
            CREATE TABLE IF NOT EXISTS ai_response_cache (
                cache_key TEXT PRIMARY KEY, -- Hash of the query/context
                response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Updating 'students' table for Rate Limiting...");
        try {
            await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS ai_usage_count INT DEFAULT 0;`);
            await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS last_ai_usage_date DATE DEFAULT CURRENT_DATE;`);
        } catch (e) {
            console.log("   (Columns might already exist, skipping)");
        }

        console.log("✅ Schema applied successfully.");

    } catch (err) {
        console.error("❌ Schema Migration Failed:", err);
    }
}

applySchema();
