
import { recomputeAnalyticsForStudent } from './lib/analytics.js';
import { getClient } from './db.js';

async function verifyV2() {
    const client = await getClient();
    try {
        console.log("=== Verifying Analytics V2 Upgrade ===");
        const SAPID = 'S9000000';

        // 1. Inject Dummy Data (Again, clean) to generate Trend
        // We need > 1 session to create a trend, but "Stable" is default if not enough data.
        // Let's just check if FIELDS exist.

        console.log("-> Running Engine...");
        const { subjectMetrics } = await recomputeAnalyticsForStudent(SAPID);

        if (subjectMetrics.length > 0) {
            const sub = subjectMetrics[0];
            console.log("First Subject:", sub.subject_code);
            console.log("Trend:", sub.trend);
            console.log("Weighted Conducted:", sub.units_conducted);
            console.log("Weighted Attended:", sub.units_attended);
            console.log("Weighted Missed:", sub.units_missed);

            if (sub.trend && sub.units_conducted !== undefined) {
                console.log("✅ V2 Fields Presnet!");
            } else {
                console.log("❌ V2 Fields MISSING!");
            }
        } else {
            // Need data to verify metric structure? 
            // Actually recompute returns defaults if no subjects.
            // But Vivaan should have subjects.
            console.log("⚠️ No subjects found for user. Cannot verify metrics structure.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

verifyV2();
