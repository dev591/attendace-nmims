/* ADDED BY ANTI-GRAVITY */
/**
 * attendance_analytics.js
 * Core logic for calculating attendance stats, risks, and projections.
 * REFACTORED: Uses Provider Pattern & Optimized for Batch Processing.
 */

import { PostgresProvider } from './providers/PostgresProvider.js';

// Configuration
const provider = new PostgresProvider();

/**
 * Calculate detailed attendance analytics for a student in a subject.
 * @param {string} studentId
 * @param {string} subjectId
 */
export async function calcAttendanceStats(studentId, subjectId) {
    try {
        // 1. Fetch Subject Context
        const enrollments = await provider.getSubjectEnrollments(studentId);
        console.log(`[calcAttendanceStats] Looking for '${subjectId}' in enrollments:`, enrollments.map(e => e.subject_id));
        console.log(`[DEBUG] IDs:`, enrollments.map(e => ({ val: e.subject_id, len: e.subject_id.length, type: typeof e.subject_id })));
        console.log(`[DEBUG] Target:`, { val: subjectId, len: subjectId.length, type: typeof subjectId });

        const subject = enrollments.find(s => String(s.subject_id).trim() === String(subjectId).trim());

        if (!subject) throw new Error(`Subject not found or not enrolled: ${subjectId}`);

        // 2. Fetch Metrics
        const metricsRows = await provider.getAttendanceMetrics([subjectId], studentId);
        const metrics = metricsRows[0] || { conducted: 0, attended: 0, total_planned: 0 };

        return computeStatsFromMetrics(subject, metrics);

    } catch (error) {
        console.error(`[ANALYTICS] Error calculating stats`, error);
        throw error;
    }
}

/**
 * Helper to compute PURE business logic from raw data.
 * @param {Object} subject - { subject_name, min_attendance_pct, total_classes, ... }
 * @param {Object} metrics - { conducted, attended, total_planned }
 */
function computeStatsFromMetrics(subject, metrics) {
    const conducted = parseInt(metrics.conducted);
    const attended = parseInt(metrics.attended);
    const totalPlanned = metrics.total_planned > 0 ? parseInt(metrics.total_planned) : (subject.total_classes || 0); // Fallback
    const minPct = subject.min_attendance_pct || 75;

    // STRICT AUDIT: No guessing. 0 conducted = 0% known attendance (or N/A).
    // We will separate "No Data" from "0%".
    let percentage = 0;
    if (conducted > 0) percentage = (attended / conducted) * 100;
    else percentage = 0; // Default to 0, not 100.

    const absentSoFar = conducted - attended;

    // Max allowed absent based on Total Planned
    const maxAllowedAbsent = Math.floor(totalPlanned * (1 - (minPct / 100)));
    const absentLeft = Math.max(0, maxAllowedAbsent - absentSoFar);

    // Calculate Predictions
    const percentIfAttend = ((attended + 1) / (conducted + 1)) * 100;
    const percentIfMiss = (attended / (conducted + 1)) * 100;

    // Risk Level
    let riskLevel = 'moderate';
    if (percentage >= minPct + 3) riskLevel = 'low';
    else if (percentage < minPct) riskLevel = 'high';

    // Suggestions
    let safeMissMessage = "";
    if (absentLeft > 0) safeMissMessage = `You can miss ${absentLeft} more classes safely.`;
    else safeMissMessage = `You cannot miss any more classes. You are ${Math.abs(absentLeft)} classes over the limit.`;

    // Confidence Logic
    const progress_pct = totalPlanned > 0 ? (conducted / totalPlanned) * 100 : 0;
    let confidence = 'LOW';
    if (conducted === 0) confidence = 'NO_DATA'; // New strict state
    else if (progress_pct >= 20) confidence = 'HIGH';
    else if (progress_pct >= 10) confidence = 'MODERATE';

    // Safe Status
    const isSafe = percentage >= minPct;

    return {
        subject_id: subject.subject_id,
        subject_code: subject.subject_code || subject.code, // Pass through
        subject_name: subject.subject_name || subject.name, // Handle variation
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
}

/**
 * Get analytics overview for all enrolled subjects
 * OPTIMIZED: Batch Fetch
 * @param {string} studentId 
 */
export async function getStudentAnalyticsOverview(studentId) {
    try {
        const enrollments = await provider.getSubjectEnrollments(studentId);
        if (!enrollments || enrollments.length === 0) return [];

        const subjectIds = enrollments.map(s => s.subject_id);
        const metricsRows = await provider.getAttendanceMetrics(subjectIds, studentId);

        // Map metrics by SubjectID for O(1) lookup
        const metricsMap = {};
        metricsRows.forEach(m => metricsMap[m.subject_id] = m);

        const results = enrollments.map(sub => {
            const metrics = metricsMap[sub.subject_id] || { conducted: 0, attended: 0, total_planned: 0 };
            return computeStatsFromMetrics(sub, metrics);
        });

        return results;
    } catch (e) {
        console.error(`[ANALYTICS] Overview Calculation Error`, e);
        return [];
    }
}

/**
 * Calculate Momentum: Consecutive days with >=1 conducted session.
 * @param {string} studentId
 */
export async function calculateMomentum(studentId) {
    try {
        const history = await provider.getDetailedSessionHistory(studentId);
        // History is sorted Date ASC

        if (history.length === 0) return 0;

        // Extract Unique Dates in Descending Order (Revoke Logic)
        const uniqueDatesSet = new Set(history.map(h => {
            // Assuming h.date is a Date object or string. 
            // PostgresProvider returns `s.date` (likely Date object).
            const d = new Date(h.date);
            return d.toISOString().split('T')[0];
        }));

        const dates = Array.from(uniqueDatesSet).sort((a, b) => new Date(b) - new Date(a)); // Descending

        if (dates.length === 0) return 0;

        // Strict Rule: If today (server time) has no conducted classes, momentum is 0?
        // Let's stick to the previous verified logic.
        const todayStr = new Date().toISOString().split('T')[0];

        if (dates[0] !== todayStr) {
            // Need to verify if 'today' works with timezone. 
            // Ideally we check if "Last Active Date" == "Today".
            // If not today, momentum breaks.
            return 0;
        }

        let momentum = 1;
        let currentDate = new Date(dates[0]);

        for (let i = 1; i < dates.length; i++) {
            const prevDate = new Date(dates[i]);

            // Diff in days
            const diffTime = Math.abs(currentDate - prevDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                momentum++;
                currentDate = prevDate;
            } else {
                break;
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

