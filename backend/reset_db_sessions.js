
import { getClient } from './db.js';

async function resetSessions() {
    console.log("🧨 WIPING ALL SESSIONS & ATTENDANCE DATA...");
    const client = await getClient();
    try {
        await client.query("TRUNCATE TABLE attendance, sessions RESTART IDENTITY CASCADE;");
        // Also clear student badges to prevent "Unlocked Badges" warning from stale data
        await client.query("TRUNCATE TABLE student_badges RESTART IDENTITY CASCADE;");
        console.log("✅ SUCCESS: Database reset to DAY 0 (Fresh State).");
    } catch (err) {
        console.error("❌ ERROR WIPING DB:", err);
    } finally {
        client.release();
        process.exit();
    }
}

resetSessions();
