
import dotenv from 'dotenv';
dotenv.config(); // defaults to .env in CWD (backend/)
import { recomputeAnalyticsForStudent } from './lib/analytics.js';
import { getClient } from './db.js';

async function debugResponse() {
    console.log("🔍 DEBUGGING API RESPONSE (FROM BACKEND)...");
    const client = await getClient();
    try {
        const sapid = 'S9000001';
        console.log(`Testing with Student SAPID: ${sapid}`);

        const { analytics, subjectMetrics } = await recomputeAnalyticsForStudent(sapid);

        console.log("\n--- RISK SUMMARY ---");
        console.log(JSON.stringify(analytics.risk_summary, null, 2));

        console.log("\n--- SUBJECT METRICS (First 3) ---");
        console.log(JSON.stringify(subjectMetrics.slice(0, 3), null, 2));

    } catch (err) {
        console.error("❌ DEBUG FAILED:", err);
    } finally {
        client.release();
        process.exit();
    }
}

debugResponse();
