
import { query } from './db.js';
import { evaluateBadges } from './lib/badge_engine.js';
import crypto from 'crypto';

async function verifyBadges() {
    console.log("🏅 BADGE VERIFICATION STARTED");
    const studentId = 'S90020054'; // Test Student

    try {
        // 1. Reset
        await query('DELETE FROM student_badges WHERE student_id = $1', [studentId]);

        // CLEAN SLATE: Delete relevant sessions to ensure "Perfect Start" logic works on fresh data
        // Get subjects
        const enrollRes = await query('SELECT subject_id FROM enrollments WHERE student_id = $1', [studentId]);
        const subjectIds = enrollRes.rows.map(r => r.subject_id);

        if (subjectIds.length > 0) {
            // Delete dependent attendance records first
            await query(`DELETE FROM attendance WHERE session_id IN (SELECT session_id FROM sessions WHERE subject_id = ANY($1))`, [subjectIds]);
            await query(`DELETE FROM sessions WHERE subject_id = ANY($1)`, [subjectIds]);
            console.log("🧹 Cleaned old sessions for subjects:", subjectIds);
        }

        console.log("Phase 1: Baseline (Expect 0 Badges)");
        const initial = await evaluateBadges(studentId);
        const unlockedInitial = initial.filter(b => b.is_unlocked);
        console.log(`   Unlocked: ${unlockedInitial.length}`);

        // 2. Simulate Perfect Start (3 Classes, 3 Attended)
        console.log("Phase 2: Simulating Perfect Start...");
        const subjectRes = await query('SELECT subject_id FROM enrollments WHERE student_id = $1 LIMIT 1', [studentId]);
        const subId = subjectRes.rows[0].subject_id;

        // Insert 3 sessions
        for (let i = 0; i < 3; i++) {
            const sessId = crypto.randomUUID();
            await query(`
                INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, room, type)
                VALUES ($1, $2, CURRENT_DATE - 1, '10:00:00', '11:00:00', 'VR', 'Lec')
             `, [sessId, subId]);

            // Mark Present
            await query(`INSERT INTO attendance (session_id, student_id, present) VALUES ($1, $2, TRUE)`, [sessId, studentId]);
        }

        // Debug History
        const historyRes = await query(`
            SELECT s.date, s.start_time, s.subject_id, a.present 
            FROM sessions s
            JOIN enrollments e ON s.subject_id = e.subject_id
            LEFT JOIN attendance a ON s.session_id = a.session_id AND a.student_id = $1
            WHERE e.student_id = $1
              AND (s.date + s.end_time) <= CURRENT_TIMESTAMP
            ORDER BY s.date ASC, s.start_time ASC
        `, [studentId]);
        console.log("DEBUG: Full History Seen by Engine:", historyRes.rows);

        // 3. Eval
        const after = await evaluateBadges(studentId);
        const perfectBadge = after.find(b => b.code === 'PERFECT_START');

        if (perfectBadge && perfectBadge.is_unlocked) {
            console.log("✅ PASSED: 'Perfect Start' Badge Unlocked!");
        } else {
            console.error("❌ FAILED: 'Perfect Start' did not unlock.");
            console.log("Debug Progress:", perfectBadge?.progress_text);
        }

        // Cleanup
        // (Optional, or keep data for manual checking)

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
verifyBadges();
