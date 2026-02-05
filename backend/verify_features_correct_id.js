
import { recomputeAnalyticsForStudent } from './lib/analytics.js';
import { getClient } from './db.js';

async function verifyLiveFeatures() {
    const client = await getClient();
    try {
        console.log("=== Verifying Live Features (Clean) ===");
        const STUDENT_ID = 'SS9000000';
        const SAPID = 'S9000000';

        // Fetch valid subject
        const subRes = await client.query('SELECT subject_id FROM subjects LIMIT 1');
        const validSubId = subRes.rows[0].subject_id;

        const sessId = 'test_sess_' + Date.now();

        try {
            // 1. Inject Dummy Data
            console.log("-> Injecting temporary data...");

            await client.query(`
                INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, status, type, school, program, semester, section)
                VALUES ($1, $2, CURRENT_DATE - INTERVAL '1 day', '10:00', '11:00', 'conducted', 'THEORY', 'MPSTME', 'engineering', 4, 'A')
                ON CONFLICT DO NOTHING
            `, [sessId, validSubId]);

            await client.query(`
                INSERT INTO attendance (session_id, student_id, present, marked_at)
                VALUES ($1, $2, true, NOW())
            `, [sessId, STUDENT_ID]);

            // 2. Run Analytics
            console.log("-> Running Analytics Engine...");
            const { analytics } = await recomputeAnalyticsForStudent(SAPID);

            // 3. Verify
            console.log("\n--- BADGES CHECK ---");
            if (analytics.badges && analytics.badges.length > 0) {
                console.log(`✅ Success! Found ${analytics.badges.length} badges.`);
            } else {
                console.log("❌ FAILURE: Badges empty.");
            }

            console.log("\n--- HEATMAP CHECK ---");
            const heatmap = analytics.weekly_heatmap || [];
            if (heatmap.length > 0) {
                console.log(`✅ Success! Heatmap has ${heatmap.length} day(s).`);
                const active = heatmap.find(d => d.total > 0);
                if (active) console.log(`   Active Day: ${active.day} (${active.attended}/${active.total})`);
                else console.log("   ⚠️ Heatmap present but all zeros.");
            } else {
                console.log("❌ FAILURE: Heatmap empty.");
            }

        } finally {
            // 4. Cleanup
            console.log("-> Cleaning up...");
            await client.query('DELETE FROM attendance WHERE session_id = $1', [sessId]);
            await client.query('DELETE FROM sessions WHERE session_id = $1', [sessId]);
        }

    } catch (e) {
        console.error("Verification Crashed:", e);
    } finally {
        client.release();
    }
}

verifyLiveFeatures();
