
import { getClient } from './db.js';

async function forceClean() {
    console.log("🧨 WIPING ENTIRE DATABASE (Master + Transactional)...");
    const client = await getClient();
    try {
        // Updated to wipe master tables too to ensure clean import
        await client.query("TRUNCATE TABLE attendance, sessions, enrollments, students, course_subjects, subjects, courses, student_badges RESTART IDENTITY CASCADE;");
        console.log("✅ SUCCESS: Database completely wiped.");
    } catch (err) {
        console.error("❌ ERROR WIPING DB:", err);
    } finally {
        client.release();
        process.exit();
    }
}

forceClean();
