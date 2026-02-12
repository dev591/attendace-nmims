
import { query } from './db.js';

async function migrateNotifications() {
    try {
        console.log("Migrating Notifications Table...");

        // 1. Notifications
        // We use VARCHAR(50) for student_id to match 'text' type of parent table
        await query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(50) NOT NULL REFERENCES students(student_id), 
                title VARCHAR(255) NOT NULL,
                message TEXT,
                type VARCHAR(50) DEFAULT 'info',
                link VARCHAR(255),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Announcements
        await query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                target_group VARCHAR(50) DEFAULT 'all', 
                target_value VARCHAR(255),
                created_by VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Migration Success.");
        process.exit(0);
    } catch (e) {
        console.error("Migration Failed:", e);
        process.exit(1);
    }
}

migrateNotifications();
