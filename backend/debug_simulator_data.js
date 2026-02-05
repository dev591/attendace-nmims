
import { recomputeAnalyticsForStudent } from './lib/analytics.js';
import { getClient } from './db.js';

async function debugSimulatorData() {
    const SAPID = 'S9000014'; // Vivaan Malhotra
    console.log(`--- DEBUGGING SIMULATOR DATA FOR ${SAPID} ---`);

    try {
        const { subjectMetrics } = await recomputeAnalyticsForStudent(SAPID);

        console.log("\n[ Subject Data Inspection ]");
        subjectMetrics.forEach(sub => {
            console.log(`\nSubject: ${sub.subject_code} (${sub.subject_id})`);
            console.log(`  Raw total_classes:   ${sub.total_classes} (${typeof sub.total_classes})`);
            console.log(`  Raw units_conducted: ${sub.units_conducted} (${typeof sub.units_conducted})`);
            console.log(`  Raw units_attended:  ${sub.units_attended} (${typeof sub.units_attended})`);

            const total = Number(sub.total_classes);
            const conducted = Number(sub.units_conducted);
            const remaining = total - conducted;

            console.log(`  -> Calculated Remaining: ${remaining}`);
            if (isNaN(remaining)) console.log("  🚨 NAN DETECTED!");
        });

    } catch (e) {
        console.error(e);
    }
}

debugSimulatorData();
