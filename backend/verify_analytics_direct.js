
import { recomputeAnalyticsForStudent } from './lib/analytics.js';

async function verify() {
    console.log("Verifying Analytics for S90020004 (Expect 10 subjects)...");
    try {
        const res = await recomputeAnalyticsForStudent('S90020004'); // Using ID
        console.log(`Analytics keys: ${Object.keys(res)}`);

        const metrics = res.subjectMetrics || [];
        console.log(`Subject Metrics Count: ${metrics.length}`);

        if (metrics.length > 0) {
            console.log("First Subject:", metrics[0].subject_code, metrics[0].subject_name);
        } else {
            console.error("FAIL: No subjects in analytics result.");
        }
    } catch (e) {
        console.error("CRASH:", e);
    } finally {
        process.exit();
    }
}
verify();
