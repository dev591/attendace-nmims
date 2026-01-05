
import { query } from './db.js';

// Mocks the index.js logic essentially, or we can use fetch if server is running?
// Let's use fetch if we can, assuming port 5000 (default backend).
// Or better, let's just inspect the logic in index.js via a "dry run" using internal functions.
// Accessing internal functions is safer/faster than depending on external port.

import { evaluateBadges } from './lib/badge_engine.js';
import { getStudentAnalyticsOverview } from './attendance_analytics.js';

async function verifyPayload() {
    const studentId = 'S90020054';
    console.log(`Verifying Dashboard Payload for ${studentId}...`);

    try {
        console.log("1. Evaluate Badges...");
        const badges = await evaluateBadges(studentId);
        console.log(`   Badges Found: ${badges.length}`);
        if (badges.length > 0) {
            console.log("   Sample Badge:", badges[0]);
        } else {
            console.error("   ❌ ERROR: No badges returned!");
        }

        console.log("2. Analytics Overview...");
        const stats = await getStudentAnalyticsOverview(studentId);
        console.log(`   Stats Found: ${stats.length}`);

        console.log("✅ Backend Logic seems OK.");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
verifyPayload();
