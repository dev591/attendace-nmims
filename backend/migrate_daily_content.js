
import { getClient } from './db.js';

async function migrate() {
    console.log("🛠 Creating daily_engineering_content table...");
    const client = await getClient();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS daily_engineering_content (
                date DATE PRIMARY KEY,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                source TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("✅ Table created (or exists).");
    } catch (e) {
        console.error("❌ Migration Failed:", e);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
