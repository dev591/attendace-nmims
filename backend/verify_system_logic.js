
import fetch from 'node-fetch';
import { getClient } from './db.js';

const API_BASE = 'http://localhost:4000';
const SAPID = '90030002'; // No S needed for this debug route if strict? Route uses req.params.sapid directly.

async function verify() {
    console.log("🚦 VERIFIYING SYSTEM LOGIC...");
    const client = await getClient();

    try {
        // 1. Initial State (Assuming no sessions)
        // Wait, we might have sessions from user? 
        // Let's check audit first.
        let res = await fetch(`${API_BASE}/debug/student/${SAPID}/system-audit`);
        let data = await res.json();

        console.log("\n📊 CURRENT STATE:");
        if (data.timetable) {
            console.log(`   Timetable Rows: ${data.timetable.count}`);
            console.log(`   Metrics:`, data.final_metrics.map(m => `${m.code}: ${m.conducted} cd, ${m.attended} at, ${m.pct}%`).join('\n          '));
        } else {
            console.log("   ❌ Failed to get audit data:", data);
        }

        // 2. Inject a PAST SESSION (Simulate "Conducted")
        // Subject: DS1011 (Programming)
        // Date: Yesterday
        console.log("\n🧪 INJECTING MOCK SESSION (Yesterday)...");
        await client.query(`
            INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, type)
            VALUES ($1, $2, CURRENT_DATE - 1, '10:00', '11:00', 'Lecture')
            ON CONFLICT (session_id) DO NOTHING
        `, [`TEST_SESSION_${Date.now()}`, 'DS1011']);

        // 3. Re-Check Audit (Expect: Conducted=1, Attended=1 (Assume Present), Pct=100)
        res = await fetch(`${API_BASE}/debug/student/${SAPID}/system-audit`);
        data = await res.json();

        const progMetric = data.final_metrics.find(m => m.code === 'DS1011');
        console.log("\n📊 POST-INJECTION STATE (DS1011):");
        console.log(`   Conducted:  ${progMetric.conducted}`);
        console.log(`   Attended:   ${progMetric.attended}`);
        console.log(`   Pct:        ${progMetric.pct}%`);
        console.log(`   Confidence: ${progMetric.confidence}`);

        if (parseInt(progMetric.conducted) >= 1 && parseInt(progMetric.attended) >= 1 && progMetric.pct === 100) {
            console.log("✅ SUCCESS: System Logic Verified (Auto-Present for Conducted Session).");
        } else {
            console.error("❌ FAILURE: Logic mismatch.");
        }

    } catch (e) {
        console.error("❌ ERROR:", e);
    } finally {
        client.release();
    }
}

verify();
