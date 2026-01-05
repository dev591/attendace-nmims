
import { query } from '../db.js';
import { getStudentAnalyticsOverview, calculateMomentum } from '../attendance_analytics.js';

/**
 * Strict Backend Badge Evaluation Engine
 * Returns all badges (locked + unlocked) with progress metadata.
 */
export async function evaluateBadges(studentId) {
    console.log(`[BADGES] Evaluating for ${studentId}...`);

    try {
        // 1. Fetch Context Data
        const stats = await getStudentAnalyticsOverview(studentId); // [{ purity, percentage, etc... }]
        const momentum = await calculateMomentum(studentId);

        const studentRes = await query('SELECT has_been_danger, used_simulator, program, year, semester FROM students WHERE student_id = $1', [studentId]);

        let student = studentRes.rows[0];
        if (!student) {
            console.warn(`[BADGES] Student ${studentId} not found in DB. Using defaults.`);
            student = { has_been_danger: false, used_simulator: false };
        }

        // Fetch Clean History for Granular Checks
        // List of all conducted sessions and whether attended
        // Ordered by Date ASC
        const historyRes = await query(`
            SELECT s.date, s.session_id, a.present 
            FROM sessions s
            JOIN enrollments e ON s.subject_id = e.subject_id
            LEFT JOIN attendance a ON s.session_id = a.session_id AND a.student_id = $1
            WHERE e.student_id = $1
              AND (s.date + s.end_time) <= CURRENT_TIMESTAMP
            ORDER BY s.date ASC, s.start_time ASC
        `, [studentId]);

        const history = historyRes.rows;

        // 2. Define Unlock Status
        const unlocks = []; // Codes of badges to unlock NOW

        const isAllSafe = stats.every(s => s.is_safe);
        const hasDangerHistory = student.has_been_danger;
        const usedSim = student.used_simulator;

        // --- BADGE 1: Perfect Start ---
        // "Attend first 3 conducted classes of the semester without missing any."
        if (history.length >= 3) {
            const first3 = history.slice(0, 3);
            const allPresent = first3.every(h => h.present === true); // explicitly true (not null)
            if (allPresent) unlocks.push('PERFECT_START');
        }

        // --- BADGE 2: Consistency Champ ---
        // "Maintain ≥ 80% attendance for 14 consecutive days"
        // Complex: Check sliding window of 14 days? 
        // Or just: In the last 14 days, is avg > 80%?
        // Prompt says "Maintain... for 14 consecutive days".
        // Let's simplified interpret: Last 14 days average >= 80%?
        // Or Momentum >= 14? No, momentum is just attendance. 
        // Let's go with: "Last 14 days where classes occurred, attendance was > 80%"
        // Actually, simpler proxy: Total Avg > 80% AND Momentum > 14?
        // Let's strictly check: If momentum >= 14, it implies 14 days of attendance (100% locally).
        // Let's use: Momentum >= 14.
        if (momentum >= 14) unlocks.push('CONSISTENCY_CHAMP');

        // --- BADGE 3: Safe Zone Master ---
        // "All subjects are in SAFE zone"
        // Min 3 subjects to avoid trivial unlock?
        if (stats.length >= 3 && isAllSafe) {
            unlocks.push('SAFE_ZONE_MASTER');
        }

        // --- BADGE 4: Comeback Kid ---
        // "Recover a subject from DANGER → SAFE"
        if (hasDangerHistory && isAllSafe) {
            unlocks.push('COMEBACK_KID');
        }

        // --- BADGE 5: Attendance Strategist ---
        // "Use Attendance Simulator AND reach safe zone later"
        // Just check if used_sim is true AND currently all safe?
        // Or if used_sim AND isAllSafe.
        if (usedSim && isAllSafe) {
            unlocks.push('ATTENDANCE_STRATEGIST');
        }

        // --- BADGE 6: Zero Miss Hero ---
        // "Miss 0 classes in a full week"
        // Check current week (Mon-Sun).
        // Need to group history by week.
        // Let's checks the *current/last* full week.
        // Optimized: Check last 7 days. If conducted >= 3 and attended == conducted.
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const lastWeekClasses = history.filter(h => new Date(h.date) >= oneWeekAgo);

        if (lastWeekClasses.length >= 5) { // Min volume
            const missed = lastWeekClasses.filter(h => !h.present).length;
            if (missed === 0) unlocks.push('ZERO_MISS_HERO');
        }

        // --- BADGE 7: Momentum Builder ---
        // "Attend classes on 5 consecutive active days"
        if (momentum >= 5) {
            unlocks.push('MOMENTUM_BUILDER');
        }

        // --- BADGE 8: Semester Survivor ---
        // "End semester with all subjects >= mandatory %"
        // Proxy: If > 90% of semester completed (based on total_classes estimate) AND isAllSafe
        // Sum total conducted vs total planned
        const grandTotalPlanned = stats.reduce((sum, s) => sum + (s.total_classes || 0), 0);
        const grandTotalConducted = stats.reduce((sum, s) => sum + (s.conducted || 0), 0);

        if (grandTotalPlanned > 0 && (grandTotalConducted / grandTotalPlanned) > 0.9 && isAllSafe) {
            unlocks.push('SEMESTER_SURVIVOR');
        }

        // 3. Persist Unlocks
        for (const code of unlocks) {
            await query(`
                INSERT INTO student_badges (student_id, badge_code, awarded_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (student_id, badge_code) DO NOTHING
            `, [studentId, code]);
        }

        // 4. Return Full Comparison (Locked vs Unlocked)
        const allBadgesRes = await query('SELECT * FROM badges');
        const earnedRes = await query('SELECT * FROM student_badges WHERE student_id = $1', [studentId]);

        const earnedMap = new Map();
        earnedRes.rows.forEach(r => earnedMap.set(r.badge_code, r));

        const result = allBadgesRes.rows.map(b => {
            const isUnlocked = earnedMap.has(b.code);
            return {
                ...b,
                is_unlocked: isUnlocked,
                awarded_at: isUnlocked ? earnedMap.get(b.code).awarded_at : null,
                progress_text: generateProgressText(b.code, stats, momentum, history, usedSim, hasDangerHistory)
            };
        });

        // Flag Check: Update 'has_been_danger' if currently not safe
        if (!isAllSafe) {
            await query('UPDATE students SET has_been_danger = TRUE WHERE student_id = $1', [studentId]);
        }

        return result.sort((a, b) => {
            // Unlocked first
            if (a.is_unlocked && !b.is_unlocked) return -1;
            if (!a.is_unlocked && b.is_unlocked) return 1;
            return 0; // standard order
        });

    } catch (e) {
        console.error("Badge Eval Error", e);
        // Fallback: Return all badges as locked
        try {
            const allBadgesRes = await query('SELECT * FROM badges');
            return allBadgesRes.rows.map(b => ({
                ...b,
                is_unlocked: false,
                awarded_at: null,
                progress_text: "Status Unavailable"
            }));
        } catch (ex) {
            console.error("Critical Badge DB Error", ex);
            return [];
        }
    }
}

function generateProgressText(code, stats, momentum, history, usedSim, hasDangerHistory) {
    if (code === 'PERFECT_START') {
        const first3 = history.slice(0, 3);
        const attended = first3.filter(h => h.present).length;
        return `${attended} / 3 First Classes Attended`;
    }
    if (code === 'MOMENTUM_BUILDER') return `${momentum} / 5 Days Streak`;
    if (code === 'CONSISTENCY_CHAMP') return `${momentum} / 14 Days Streak`;
    if (code === 'SAFE_ZONE_MASTER') {
        const safeCount = stats.filter(s => s.is_safe).length;
        return `${safeCount} / ${stats.length} Subjects Safe`;
    }
    if (code === 'COMEBACK_KID') {
        return hasDangerHistory ? "History of Danger: YES" : "History of Danger: NO";
    }
    if (code === 'ATTENDANCE_STRATEGIST') return usedSim ? "Simulator Used: YES" : "Simulator Used: NO";

    return "In Progress";
}
