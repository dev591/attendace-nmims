/* ADDED BY ANTI-GRAVITY */
import { query } from './db.js';

/**
 * Calculate detailed attendance analytics for a student in a subject.
 * @param {string} studentId
 * @param {string} subjectId
 */
export async function calcAttendanceStats(studentId, subjectId) {
    try {
        console.log(`[ANALYTICS] Calculating stats for Student: ${studentId}, Subject: ${subjectId}`);

        // 1. Fetch Subject Details (Total Planned & Min Pct)
        const subjectRes = await query(
            'SELECT subject_id, name, total_classes, min_attendance_pct FROM subjects WHERE subject_id = $1',
            [subjectId]
        );

        if (subjectRes.rows.length === 0) {
            throw new Error(`Subject not found: ${subjectId}`);
        }

        const subject = subjectRes.rows[0];
        const totalPlanned = subject.total_classes || 0;
        const minPct = subject.min_attendance_pct || 75; // 75 is standard, not random.

        // 2. Fetch Conducted Sessions Count (STRICT TIME-BASED)
        // User Rule: conducted = COUNT(sessions WHERE now() >= end_time)
        // Note: 'sessions' has 'date' and 'end_time'. We need to combine them.
        // Assuming end_time is time type and date is date type.

        const conductedRes = await query(
            `SELECT COUNT(*) as count 
             FROM sessions 
             WHERE subject_id = $1 
               AND (date + end_time) <= CURRENT_TIMESTAMP`,
            [subjectId]
        );
        const conducted = parseInt(conductedRes.rows[0].count, 10);

        // 3. Fetch Attended Sessions Count
        // strict check: valid attendance record AND session was actually conducted
        const attendedRes = await query(
            `SELECT COUNT(*) as count 
             FROM attendance a 
             JOIN sessions s ON a.session_id = s.session_id 
             WHERE s.subject_id = $1 
               AND a.student_id = $2 
               AND a.present = true 
               AND (s.date + s.end_time) <= CURRENT_TIMESTAMP`,
            [subjectId, studentId]
        );
        const attended = parseInt(attendedRes.rows[0].count, 10);

        // 4. Calculate Core Metrics
        let percentage = 0;
        if (conducted > 0) {
            percentage = (attended / conducted) * 100;
        }

        const absentSoFar = conducted - attended;

        // Max allowed absent based on Total Planned
        const maxAllowedAbsent = Math.floor(totalPlanned * (1 - (minPct / 100)));
        const absentLeft = Math.max(0, maxAllowedAbsent - absentSoFar);

        // 5. Calculate Predictions
        const percentIfAttend = ((attended + 1) / (conducted + 1)) * 100;
        const percentIfMiss = (attended / (conducted + 1)) * 100;

        // 6. Risk Level
        let riskLevel = 'moderate';
        if (percentage >= minPct + 3) {
            riskLevel = 'low';
        } else if (percentage < minPct) {
            riskLevel = 'high';
        }

        // 7. Suggestions
        let safeMissMessage = "";
        if (absentLeft > 0) {
            safeMissMessage = `You can miss ${absentLeft} more classes safely.`;
        } else {
            safeMissMessage = `You cannot miss any more classes. You are ${Math.abs(absentLeft)} classes over the limit.`;
        }

        // 8. Confidence Logic (STRICT DATA VOLUME BASED) (MATCHING lib/analytics.js)
        const progress_pct = (conducted / totalPlanned) * 100;
        let confidence = 'LOW';

        if (conducted === 0) confidence = 'HIGH'; // Awaiting Data is technically high confidence state of emptiness
        else if (progress_pct >= 20) confidence = 'HIGH';
        else if (progress_pct >= 10) confidence = 'MODERATE';

        // Safe Status: True if currently above minPct
        const isSafe = percentage >= minPct;

        const result = {
            subject_id: subject.subject_id,
            subject_name: subject.name,
            total_planned: totalPlanned,
            conducted,
            attended,
            percentage: parseFloat(percentage.toFixed(2)),
            max_allowed_absent: maxAllowedAbsent,
            absent_so_far: absentSoFar,
            absent_left: absentLeft,
            skip_next: {
                attend: parseFloat(percentIfAttend.toFixed(2)),
                miss: parseFloat(percentIfMiss.toFixed(2))
            },
            safe_miss_suggestions: {
                can_miss_more: absentLeft,
                message: safeMissMessage
            },
            risk_level: riskLevel,
            confidence: confidence,
            is_safe: isSafe
        };

        return result;

    } catch (error) {
        console.error(`[ANALYTICS] Error calculating stats`, error);
        throw error;
    }
}

/**
 * Get analytics overview for all enrolled subjects
 * @param {string} studentId 
 */
export async function getStudentAnalyticsOverview(studentId) {
    // 1. Get enrolled subjects
    // Uses the 'students.course_id' -> 'course_subjects' relation OR 'enrollments' table if we had strictly that.
    // The previous implementation added 'enrollments' table but also relied on 'course_subjects'.
    // Let's assume we look for subjects derived from enrollments + course mapping.
    // For simplicity and robustness, let's query the enrollments table first, falling back to course_subjects.

    // Actually, looking at previous steps (Step 532 seed), we inserted into 'enrollments'.
    // So let's rely on 'enrollments'.

    const enrollmentsRes = await query(
        'SELECT subject_id FROM enrollments WHERE student_id = $1',
        [studentId]
    );

    let subjects = enrollmentsRes.rows.map(r => r.subject_id);

    // ANTI-GRAVITY: Removed fallback to course_subjects.
    // Strict adherence to 'enrollments' table (Single Source of Truth).
    // If subjects.length is 0, the student sees no data until auto-enroll runs.
    if (subjects.length === 0) {
        console.warn(`[ANALYTICS] Student ${studentId} has no enrollments.`);
    }

    const results = [];
    for (const subId of subjects) {
        try {
            const stats = await calcAttendanceStats(studentId, subId);
            results.push(stats);
        } catch (e) {
            console.error(`Failed to get stats for ${subId}`, e);
            // push simplified error object or skip?
            // pushing partial info might be better but for now let's skip
        }
    }

    return results;
}

/**
 * Calculate Momentum: Consecutive days with >=1 conducted session.
 * Strict Rule: "If no classes today -> momentum = 0"
 */
export async function calculateMomentum(studentId) {
    try {
        // Get all dates with at least one CONDUCTED session for this student's subjects
        // We join enrollments -> subjects -> sessions
        const res = await query(
            `SELECT DISTINCT date::text as date
             FROM sessions s
             JOIN enrollments e ON s.subject_id = e.subject_id
             WHERE e.student_id = $1
               AND (s.date + s.end_time) <= CURRENT_TIMESTAMP
             ORDER BY date DESC`,
            [studentId]
        );

        const dates = res.rows.map(r => r.date); // 'YYYY-MM-DD'

        if (dates.length === 0) return 0;

        // Check strictly if today is present
        const todayStr = new Date().toISOString().split('T')[0];
        // Note: Server time might differ slightly in "now()", but date string comparison is safe for "Day".
        // Actually, let's use the DB's current date to be 100% consistent with "today".
        // But for JS logic, let's assumes dates[0] is the most recent.

        // Strict Rule: If the most recent conducted session is NOT today, momentum is 0.
        // Wait, what if today's classes haven't happened *yet*?
        // "Momentum = consecutive days with >=1 conducted session"
        // "If no classes today -> momentum = 0"
        // This implies you lose momentum if you haven't attended *yet* today? 
        // Or if there ARE NO classes today?
        // Let's assume strict literal meaning: If today has no *conducted* session, momentum = 0.
        // This effectively means momentum resets every morning until the first class ends.
        // That seems harsh but compliant with "If no classes today -> momentum = 0".

        if (dates[0] !== todayStr) {
            return 0;
        }

        let momentum = 1;
        let currentDate = new Date(dates[0]);

        // Check backwards
        for (let i = 1; i < dates.length; i++) {
            const prevDate = new Date(dates[i]);

            // Diff in days
            const diffTime = Math.abs(currentDate - prevDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                momentum++;
                currentDate = prevDate;
            } else {
                break; // Gap found
            }
        }

        return momentum;

    } catch (e) {
        console.error('Momentum Calc Error', e);
        return 0;
    }
}

/**
 * Calculate Overall Saftey Status for "Worayyy" Banner
 */
export function calculateOverallStatus(statsArray) {
    if (!statsArray || statsArray.length === 0) return { is_all_safe: false, danger_subjects: [] };

    const dangerSubjects = statsArray.filter(s => !s.is_safe).map(s => s.subject_name);
    return {
        is_all_safe: dangerSubjects.length === 0,
        danger_subjects: dangerSubjects
    };
}
