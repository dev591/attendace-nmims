
import { recomputeAnalyticsForStudent } from './lib/analytics.js';
import { getClient } from './db.js';

async function demonstrateAutomation() {
    const client = await getClient();
    try {
        console.log("=== Demonstration: Auto-Calculating Conducted Classes ===");
        const SAPID = 'S9000000';
        const STUDENT_ID = 'SS9000000';

        // 1. Setup: Clean previous test data
        await client.query("DELETE FROM sessions WHERE subject_id = 'AUTO_DEMO'");
        await client.query("DELETE FROM enrollments WHERE subject_id = 'AUTO_DEMO'");
        await client.query("DELETE FROM subjects WHERE subject_id = 'AUTO_DEMO'");
        await client.query("DELETE FROM curriculum WHERE subject_code = 'AUTO101'");

        // 2. Create Dummy Subject & Curriculum
        // JOIN constraint requires curriculum entry matching student context (Eng-CSE, Year 3, Sem 4)
        await client.query("INSERT INTO subjects (subject_id, name, code, credits) VALUES ('AUTO_DEMO', 'Automation Demo', 'AUTO101', 4)");
        await client.query(`
            INSERT INTO curriculum (subject_code, subject_name, program, year, semester, total_classes, min_attendance_pct, school)
            VALUES ('AUTO101', 'Automation Demo', 'engineering-cse', 3, 4, 45, 75, 'MPSTME')
        `);
        await client.query("INSERT INTO enrollments (student_id, subject_id) VALUES ($1, 'AUTO_DEMO')", [STUDENT_ID]);

        // 3. Insert Time-Based Sessions (Dynamic)
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        const fmtTime = (d) => d.toTimeString().split(' ')[0]; // HH:MM:SS

        console.log(`-> Current Server Time: ${now.toLocaleString()}`);
        console.log("-> Inserting 4 Sessions:");

        const sessions = [
            { id: 'sess_past', dayOffset: -1, time: '10:00', desc: 'Yesterday (Past)' },
            { id: 'sess_recent', dayOffset: 0, time: fmtTime(twoHoursAgo), desc: 'Today (2 Hours Ago) - Finished' },
            { id: 'sess_soon', dayOffset: 0, time: fmtTime(twoHoursLater), desc: 'Today (In 2 Hours) - Upcoming' },
            { id: 'sess_future', dayOffset: 1, time: '10:00', desc: 'Tomorrow (Future)' }
        ];

        for (const s of sessions) {
            console.log(`   - [${s.desc}] Scheduled at ${s.time} (Offset: ${s.dayOffset}d)`);
            await client.query(`
                INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, status, type, school, program, semester, section)
                VALUES ($1, 'AUTO_DEMO', CURRENT_DATE + $2 * INTERVAL '1 day', $3::time, $3::time + INTERVAL '1 hour', 'scheduled', 'THEORY', 'MPSTME', 'engineering', 4, 'A')
            `, [s.id, s.dayOffset, s.time]);
        }

        // 4. Run Analytics Engine
        console.log("\n-> 🔄 Running Analytics Engine (Simulating Page Refresh)...");
        const { subjectMetrics } = await recomputeAnalyticsForStudent(SAPID);

        // 5. Inspect Result
        const demoSub = subjectMetrics.find(s => s.subject_id === 'AUTO_DEMO');
        if (demoSub) {
            console.log("\n-> ✅ RESULT: System Calculated Value:");
            console.log(`   Conducted Count: ${demoSub.units_conducted}`);
            console.log(`   Total Planned:   ${demoSub.total_classes}`);

            // Expected: Yesterday + Today Morning = 2.
            const expected = 2;
            if (demoSub.units_conducted === expected) {
                console.log(`   ✨ SUCCESS: The system automatically detected ${expected} classes have passed.`);
                console.log("   (Yesterday + Today Morning were counted. Today Night + Tomorrow were ignored).");
            } else {
                console.log(`   ❌ MISMATCH: Expected ${expected}, got ${demoSub.units_conducted}`);
            }
        } else {
            console.log("❌ Error: Demo subject not found. Available:", subjectMetrics.map(s => s.subject_id));
        }

    } catch (e) {
        console.error(e);
    } finally {
        // Cleanup (Correct Order)
        await client.query("DELETE FROM sessions WHERE subject_id = 'AUTO_DEMO'");
        await client.query("DELETE FROM enrollments WHERE subject_id = 'AUTO_DEMO'");
        await client.query("DELETE FROM subjects WHERE subject_id = 'AUTO_DEMO'");
        await client.query("DELETE FROM curriculum WHERE subject_code = 'AUTO101'");
        client.release();
    }
}

demonstrateAutomation();
