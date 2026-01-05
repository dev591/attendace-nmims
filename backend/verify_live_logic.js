
import { query } from './db.js';
import { calcAttendanceStats, calculateMomentum } from './attendance_analytics.js';
import crypto from 'crypto';

// LIVE INTEGRITY CHECK
// Simulates the passage of time for a class session.

async function verifyLiveLogic() {
    console.log("🕵️‍♂️ STARTING LIVE LOGIC VERIFICATION...");
    const studentId = 'S90020054'; // MBA Test Student

    try {
        // 1. Get a valid subject for this student
        const enrollRes = await query('SELECT subject_id FROM enrollments WHERE student_id = $1 LIMIT 1', [studentId]);
        if (enrollRes.rows.length === 0) throw new Error('No enrolled subjects found for test.');
        const subjectId = enrollRes.rows[0].subject_id;

        console.log(`Phase 1: Baseline Check for Subject ${subjectId}`);
        const preStats = await calcAttendanceStats(studentId, subjectId);
        console.log(`   Conducted (Pre): ${preStats.conducted}`);

        // 2. Insert a PAST session (1 hour ago) -> Should be CONDUCTED
        console.log("Phase 2: Inserting PAST session...");
        const newSessionId = crypto.randomUUID();
        await query(`
            INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, room, type)
            VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME - interval '2 hours', CURRENT_TIME - interval '1 hour', 'TEST_ROOM', 'Lecre')
            RETURNING session_id
        `, [newSessionId, subjectId]);

        // 3. Check Stats -> Conducted should increase by 1
        const postStats = await calcAttendanceStats(studentId, subjectId);
        console.log(`   Conducted (Post): ${postStats.conducted}`);

        if (postStats.conducted !== preStats.conducted + 1) {
            console.error("❌ FAILED: Conducted count did not increase!");
        } else {
            console.log("✅ PASSED: Conducted count increased dynamically.");
        }

        // 4. Check Momentum
        console.log("Phase 3: Verify Momentum");
        const mom = await calculateMomentum(studentId);
        console.log(`   Current Momentum: ${mom}`);
        // If we just added a conducted class today, momentum should be at least 1.
        if (mom < 1) console.error("❌ FAILED: Momentum should be >= 1 for today.");
        else console.log("✅ PASSED: Momentum recognized today's class.");

        // 5. Cleanup
        console.log("Phase 4: Cleanup");
        await query('DELETE FROM sessions WHERE session_id = $1', [newSessionId]);
        console.log("✅ Cleanup complete.");

    } catch (e) {
        console.error("Verification Error:", e);
    } finally {
        process.exit();
    }
}
verifyLiveLogic();
