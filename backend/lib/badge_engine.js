/* ADDED BY ANTI-GRAVITY */
import { PostgresProvider } from '../providers/PostgresProvider.js';
import { getStudentAnalyticsOverview, calculateMomentum } from '../attendance_analytics.js';

const provider = new PostgresProvider();

/**
 * Strict Backend Badge Evaluation Engine
 * Returns all badges (locked + unlocked) with progress metadata.
 */
export async function evaluateBadges(studentId) {
    console.log(`[BADGES] Evaluating for ${studentId}...`);

    try {
        // 1. Fetch Context Data
        // Now fully provider-backed via imported functions
        const stats = await getStudentAnalyticsOverview(studentId);
        const momentum = await calculateMomentum(studentId);

        // Fetch Student Profile via Provider
        const student = await provider.getStudentProfile(studentId);

        let hasDangerHistory = false;
        let usedSim = false;

        if (!student) {
            console.warn(`[BADGES] Student ${studentId} not found. Using defaults.`);
        } else {
            hasDangerHistory = student.has_been_danger;
            usedSim = student.used_simulator;
        }

        // Fetch Clean History for Granular Checks
        const history = await provider.getDetailedSessionHistory(studentId);

        // 2. Define Unlock Status
        const unlocks = []; // Codes of badges to unlock NOW

        const isAllSafe = stats.every(s => s.is_safe);

        // --- BADGE 1: Perfect Start ---
        // "Attend first 3 conducted classes of the semester without missing any."
        if (history.length >= 3) {
            const first3 = history.slice(0, 3);
            const allPresent = first3.every(h => h.present === true); // explicitly true (not null)
            if (allPresent) unlocks.push('PERFECT_START');
        }

        // --- BADGE 2: Consistency Champ ---
        // "Maintain ≥ 80% attendance for 14 consecutive days"
        // Proxy: Momentum >= 14
        if (momentum >= 14) unlocks.push('CONSISTENCY_CHAMP');

        // --- BADGE 3: Safe Zone Master ---
        // "All subjects are in SAFE zone"
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
        if (usedSim && isAllSafe) {
            unlocks.push('ATTENDANCE_STRATEGIST');
        }

        // --- BADGE 6: Zero Miss Hero ---
        // "Miss 0 classes in a full week" (Last 7 Days)
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
        const grandTotalPlanned = stats.reduce((sum, s) => sum + (s.total_classes || 0), 0);
        const grandTotalConducted = stats.reduce((sum, s) => sum + (s.conducted || 0), 0);

        if (grandTotalPlanned > 0 && (grandTotalConducted / grandTotalPlanned) > 0.9 && isAllSafe) {
            unlocks.push('SEMESTER_SURVIVOR');
        }

        // 3. Persist Unlocks
        for (const code of unlocks) {
            await provider.awardBadge(studentId, code);
        }

        // 4. Return Full Comparison (Locked vs Unlocked)
        const allBadges = await provider.getAllBadges();
        const earnedBadges = await provider.getEarnedBadges(studentId);

        const earnedMap = new Map();
        earnedBadges.forEach(r => earnedMap.set(r.badge_code, r));

        const result = allBadges.map(b => {
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
            await provider.markStudentDangerHistory(studentId);
        }

        return result.sort((a, b) => {
            // Unlocked first
            if (a.is_unlocked && !b.is_unlocked) return -1;
            if (!a.is_unlocked && b.is_unlocked) return 1;
            return 0; // standard order
        });

    } catch (e) {
        console.error("Badge Eval Error", e);
        // Fallback: Return empty/safe response
        return [];
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

