import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
import { recomputeAnalyticsForStudent } from './lib/analytics.js';
import { getClient } from './db.js';

async function applyStrictLogic() {
    console.log("🚀 STARTING STRICT LOGIC MIGRATION...");
    const client = await getClient();

    try {
        const res = await client.query("SELECT sapid FROM students");
        const students = res.rows;
        console.log(`Found ${students.length} students to update.`);

        for (const s of students) {
            console.log(`Processing ${s.sapid}...`);
            const { analytics, attendanceSummary, subjectMetrics } = await recomputeAnalyticsForStudent(s.sapid);

            // Persist to DB
            await client.query(
                `UPDATE students 
                 SET analytics = $1, 
                     attendance_summary = $2, 
                     subject_metrics = $3
                 WHERE sapid = $4`,
                [JSON.stringify(analytics), JSON.stringify(attendanceSummary), JSON.stringify(subjectMetrics), s.sapid]
            );
        }

        console.log("✅ STRICT LOGIC APPLIED TO ALL STUDENTS.");

    } catch (err) {
        console.error("❌ MIGRATION FAILED:", err);
    } finally {
        client.release();
        process.exit();
    }
}

applyStrictLogic();
