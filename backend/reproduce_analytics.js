
import { recomputeAnalyticsForStudent } from './lib/analytics.js';

async function reproduce() {
    console.log("Testing analytics for 90030002...");
    const result = await recomputeAnalyticsForStudent("90030002");
    console.log("Subjects found:", result.subjectMetrics.length);
    if (result.subjectMetrics.length === 0) {
        console.error("FAIL: No subjects returned.");
    } else {
        console.log("SUCCESS: Subjects returned:", result.subjectMetrics.map(s => s.subject_code));
    }
    process.exit();
}

reproduce();
