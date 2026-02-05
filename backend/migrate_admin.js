
import { query } from './db.js';

async function migrate() {
    try {
        console.log("Starting Migration...");

        // 1. Add Parent Details to Students
        console.log("1. Adding Parent Columns to Students...");
        await query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(50);
        `);
        console.log("   -> Done.");

        // 2. Create Upload Logs Table
        console.log("2. Creating Upload Logs Table...");
        await query(`
            CREATE TABLE IF NOT EXISTS upload_logs (
                log_id SERIAL PRIMARY KEY,
                file_name VARCHAR(255) NOT NULL,
                file_type VARCHAR(50) NOT NULL, -- 'student_data', 'timetable', etc.
                status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'partial'
                total_rows INTEGER DEFAULT 0,
                processed_rows INTEGER DEFAULT 0,
                error_log TEXT,
                uploaded_by VARCHAR(100), -- Admin SAPID
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("   -> Done.");

        console.log("Migration Complete Successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
}

migrate();
