
import { recomputeAnalyticsForStudent } from './lib/analytics.js';
import { getClient } from './db.js';

async function verify() {
    const client = await getClient();
    try {
        console.log("=== Verifying Analytics Engine Upgrade ===");
        const TEST_USER = 'SS9000000'; // Vivaan

        const { analytics } = await recomputeAnalyticsForStudent(TEST_USER);

        console.log("\n--- BADGES ---");
        if (analytics.badges && analytics.badges.length > 0) {
            console.log(`✅ Returned ${analytics.badges.length} badges (incl locked).`);
            console.log("Sample:", analytics.badges[0].name);
        } else {
            console.log("❌ BADGES MISSING or EMPTY.");
        }

        console.log("\n--- WEEKLY HEATMAP ---");
        if (analytics.weekly_heatmap && analytics.weekly_heatmap.length > 0) {
            console.log(`✅ Returned ${analytics.weekly_heatmap.length} days of heatmap data.`);
            console.table(analytics.weekly_heatmap);
        } else {
            console.log("❌ HEATMAP MISSING or EMPTY.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

verify();
