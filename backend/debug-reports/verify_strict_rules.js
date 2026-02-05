


import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

import { PostgresProvider } from '../providers/PostgresProvider.js';
import { recomputeAnalyticsForStudent } from '../lib/analytics.js';
import { getClient } from '../db.js';

async function verifyStrictRules() {
    console.log("--- STARTING STRICT AUDIT VERIFICATION ---");
    const provider = new PostgresProvider();
    const client = await getClient();
    const STUDENT_ID = 'SS90012023';

    try {
        // 1. CLEAR SESSIONS & ATTENDANCE to Ensure Clean Slate
        console.log("1. Cleaning Test Data...");
        await client.query("DELETE FROM attendance WHERE student_id = $1", [STUDENT_ID]);
        await client.query("DELETE FROM student_badges WHERE student_id = $1", [STUDENT_ID]);
        // Reset sessions to scheduled
        await client.query("UPDATE sessions SET status = 'scheduled' WHERE subject_id IN (SELECT subject_id FROM enrollments WHERE student_id = $1)", [STUDENT_ID]);

        console.log("2. Testing Pure 'Scheduled' State (Should be 0%, PENDING)");
        const res1 = await recomputeAnalyticsForStudent(STUDENT_ID.substring(1)); // sapid is S900...
        const sub1 = res1.subjectMetrics[0];
        console.log(`[TEST 1] Status: ${sub1.status} (Expected: PENDING)`);
        console.log(`[TEST 1] Pct: ${sub1.attendance_percentage}% (Expected: 0)`);
        console.log(`[TEST 1] Confidence: ${sub1.confidence} (Expected: LOW/NO_DATA)`);

        if (sub1.attendance_percentage !== 0 || sub1.status !== 'PENDING') {
            throw new Error("FAILED Strict Rule: 0 conducted must be 0% and PENDING");
        }

        // 2. Mark ONE session as 'conducted' but NO attendance (Absent in strict mode? Or just conducted?)
        // In strict mode, if conducted and NO attendance record -> Absent? 
        // Provider code: `WHERE (a.present = true)` -> if null, it's NOT true, so NOT attended.
        // So conducted=1, attended=0 => 0%.
        console.log("3. Testing Conducted but No Attendance (Should be 0%, Absent)");
        const sessionRes = await client.query(`
            SELECT session_id FROM sessions 
            WHERE subject_id = $1 LIMIT 1
        `, [sub1.subject_id]);
        if (sessionRes.rows.length === 0) {
            console.log("   [INFO] No sessions found. Creating one...");
            const insertRes = await client.query(`
                INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, room, status, type)
                VALUES ('TEST_SESSION_1', $1, CURRENT_DATE, '10:00', '11:00', '101', 'scheduled', 'theory')
                RETURNING session_id
            `, [sub1.subject_id]);
            sessionRes.rows.push(insertRes.rows[0]);
        }
        const sessionId = sessionRes.rows[0].session_id;

        await client.query("UPDATE sessions SET status = 'conducted' WHERE session_id = $1", [sessionId]);

        const res2 = await recomputeAnalyticsForStudent(STUDENT_ID.substring(1));
        const sub2 = res2.subjectMetrics.find(s => s.subject_id === sub1.subject_id);
        console.log(`[TEST 2] Conducted: ${sub2.units_conducted} (Expected: 1)`);
        console.log(`[TEST 2] Attended: ${sub2.units_attended} (Expected: 0)`);
        console.log(`[TEST 2] Pct: ${sub2.attendance_percentage}% (Expected: 0)`);

        if (sub2.units_conducted !== 1 || sub2.units_attended !== 0) {
            throw new Error("FAILED Strict Rule: Conducted without attendance record must be Absent");
        }

        // 3. Mark Attendance as TRUE
        console.log("4. Testing Verified Present (Should be 100%)");
        await client.query(`
            INSERT INTO attendance (session_id, student_id, present)
            VALUES ($1, $2, TRUE)
        `, [sessionId, STUDENT_ID]);

        const res3 = await recomputeAnalyticsForStudent(STUDENT_ID.substring(1));
        const sub3 = res3.subjectMetrics.find(s => s.subject_id === sub1.subject_id);
        console.log(`[TEST 3] Attended: ${sub3.units_attended} (Expected: 1)`);
        console.log(`[TEST 3] Pct: ${sub3.attendance_percentage}% (Expected: 100)`);


        // 4. Test Badge Logic (Zero Miss Hero requires 5 sessions in a week)
        // Let's test 'Perfect Start' (First 3 classes attended)
        // We have 1 attended session (Test 3). We need 2 more.
        console.log("5. Testing Badges (Perfect Start -> Needs 3 attended)");
        // Insert 2 more conducted & attended sessions
        for (let i = 2; i <= 3; i++) {
            const insertRes = await client.query(`
                INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, room, status, type)
                VALUES ($1, $2, CURRENT_DATE, '10:00', '11:00', '101', 'conducted', 'theory')
                RETURNING session_id
            `, [`TEST_SESSION_${i}`, sub1.subject_id]);

            await client.query(`
                INSERT INTO attendance (session_id, student_id, present)
                VALUES ($1, $2, TRUE)
            `, [`TEST_SESSION_${i}`, STUDENT_ID]);
        }

        const resBadge = await recomputeAnalyticsForStudent(STUDENT_ID.substring(1));
        const perfectStart = resBadge.analytics.badges.find(b => b.code === 'PERFECT_START');
        console.log(`[TEST 5] Perfect Start Unlocked: ${perfectStart?.is_unlocked} (Expected: true)`);

        if (!perfectStart?.is_unlocked) {
            throw new Error("FAILED Strict Rule: Badges should unlock on verified data");
        }

        console.log("✅ STRICT AUDIT PASSED");

    } catch (e) {
        console.error("❌ AUDIT FAILED:", e);
    } finally {
        // Cleanup? Maybe leave for visual inspection
        client.release();
    }
}

verifyStrictRules();
