/* ADDED BY ANTI-GRAVITY */
/**
 * analytics.js
 * Server-side analytics computation.
 */

import { getClient, query } from '../db.js';
import { getSubjectsForStudent } from './subject_service.js';
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'debug-reports');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

export function safeAnalyticsDefaults() {
    return {
        attendanceRate: 0,
        streakDays: 0,
        projectedRank: null,
        lastUpdated: null,
        weekly_heatmap: [],
        best_day: '-',
        best_day_pct: 0,
        worst_day: '-',
        worst_day_pct: 0
    };
}

export function safeAttendanceSummaryDefaults() {
    return {
        totalSessions: 0,
        attended: 0,
        missed: 0,
        percentage: 0
    };
}

/**
 * Computes all analytics for a student from source-of-truth tables.
 */
export async function recomputeAnalyticsForStudent(sapid) {
    const client = await getClient();
    try {
        // 1. Centralized Subject Resolution
        const { student: strictInfo, subjects: currRows } = await getSubjectsForStudent(sapid);

        if (!currRows || currRows.length === 0) {
            return { analytics: safeAnalyticsDefaults(), attendanceSummary: safeAttendanceSummaryDefaults(), subjectMetrics: [] };
        }

        const studentId = strictInfo.student_id;

        // 2. TIMETABLE LOGIC: Mark sessions as 'conducted' if time passed
        // This is a lazy update for data consistency
        await client.query(`
            UPDATE sessions 
            SET status = 'conducted' 
            WHERE status = 'scheduled' 
            AND (
                date < CURRENT_DATE 
                OR (date = CURRENT_DATE AND end_time < CURRENT_TIME)
            )
        `);

        // 3. FETCH REAL METRICS (Strict + Pre-SAP Assumption)
        // A. Conducted: All sessions in past for the student's subjects
        // B. Attended: Conducted sessions where (Attendance = Present OR Attendance IS NULL)
        const metricsRes = await client.query(`
            WITH relevant_sessions AS (
                SELECT session_id, subject_id
                FROM sessions
                WHERE subject_id = ANY($1)
                AND (status = 'conducted' OR (date < CURRENT_DATE) OR (date = CURRENT_DATE AND end_time < CURRENT_TIME))
            ),
            attended_count AS (
                SELECT rs.subject_id, count(*) as a_count
                FROM relevant_sessions rs
                LEFT JOIN attendance a ON rs.session_id = a.session_id AND a.student_id = $2
                WHERE (a.present = true OR a.present IS NULL) -- Pre-SAP: Assume present if missing
                GROUP BY rs.subject_id
            ),
            conducted_count AS (
                SELECT subject_id, count(*) as c_count
                FROM relevant_sessions
                GROUP BY subject_id
            )
            SELECT 
                sub.subject_id, 
                COALESCE(cc.c_count, 0) as conducted,
                COALESCE(ac.a_count, 0) as attended
            FROM unnest($1::text[]) as sub(subject_id)
            LEFT JOIN conducted_count cc ON cc.subject_id = sub.subject_id
            LEFT JOIN attended_count ac ON ac.subject_id = sub.subject_id
        `, [currRows.map(s => s.subject_id), studentId]);

        const statsMap = {};
        metricsRes.rows.forEach(r => {
            statsMap[r.subject_id] = { conducted: parseInt(r.conducted), attended: parseInt(r.attended) };
        });

        // 4. Compute Per-Subject Metrics
        let totalClasses = 0;
        let totalAttended = 0;

        const subjectMetrics = currRows.map(sub => {
            const stats = statsMap[sub.subject_id] || { conducted: 0, attended: 0 };
            const conducted = stats.conducted;
            const attended = stats.attended;

            const mandatory = sub.min_attendance_pct || 75;
            totalClasses += conducted;
            totalAttended += attended;

            // CORE RULE: If 0 conducted, 100% Attendance (Benefit of Doubt)
            const pct = conducted > 0 ? (attended / conducted) * 100 : 100;

            // Generate Academic Indicators
            const total_planned = sub.total_classes || 45;
            const remaining = Math.max(0, total_planned - conducted);

            // CONFIDENCE LOGIC
            // 1. If Attendance is Good (>= Mandatory), we are HIGHLY CONFIDENT strict action is not needed.
            // 2. If Attendance is Bad (< Mandatory):
            //    - Early (< 20% done): LOW CONFIDENCE (Volatility is high, easy to recover).
            //    - Late (>= 20% done): HIGH CONFIDENCE (You are likely in trouble).

            let confidence = "HIGH_CONFIDENCE"; // Default to High
            const progress_pct = total_planned > 0 ? (conducted / total_planned) * 100 : 0;

            if (pct >= mandatory) {
                // Performing well = High Confidence
                confidence = "HIGH_CONFIDENCE";
            } else {
                // Performing poorly
                if (conducted === 0) confidence = "HIGH_CONFIDENCE"; // Clean slate
                else if (progress_pct < 20) confidence = "LOW_CONFIDENCE"; // Early days, volatile
                else confidence = "HIGH_CONFIDENCE"; // Late days, solid failure
            }

            // DANGER ZONE CALCULATION
            // Can I still reach 75%?
            // Max Possible = (Attended + Remaining) / Total
            const max_possible_attended = attended + remaining;
            const max_possible_pct = total_planned > 0 ? (max_possible_attended / total_planned) * 100 : 100;
            const in_danger = max_possible_pct < mandatory;

            const indicators = {
                danger_zone: in_danger,
                safe_zone: !in_danger,
                margin: (pct - mandatory).toFixed(1),
                confidence_index: confidence,
                survival_status: in_danger ? 'CRITICAL' : 'SURVIVABLE',
                policy: { mandatory_pct: mandatory, total_classes: total_planned },
                danger_details: in_danger ? `Cannot reach ${mandatory}% even with 100% attendance.` : null
            };

            // STATUS MAPPING
            let status = "SAFE";
            if (conducted === 0) status = "SAFE";
            else if (in_danger) status = "DANGER";
            else if (pct < mandatory) status = "WARNING";

            return {
                subject_id: sub.subject_id,
                subject_name: sub.subject_name,
                subject_code: sub.subject_code,
                attendance_percentage: parseFloat(pct.toFixed(2)),
                classes_conducted: conducted,
                classes_attended: attended,
                status: status,
                confidence: confidence === "HIGH_CONFIDENCE" ? "HIGH" : "LOW",
                academic_indicators: indicators,

                // PASSTHROUGH
                total_classes: total_planned,
                credits: sub.credits || 4,
                mandatory_pct: mandatory,

                // AUDIT TRAIL
                audit_trail: {
                    formula_used: conducted > 0 ? "(attended / conducted) * 100" : "Default 100% (No Classes)",
                    conducted,
                    attended,
                    status
                }
            };
        });

        // 5. Global Stats
        const globalPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;

        // Streak Logic (Simplified for MVP)
        // ... (Keep existing streak logic or simplify)
        // Re-using existing streak logic query if needed, or simple 0
        const streak = 0; // Placeholder for now to focus on core accuracy

        const analytics = {
            attendanceRate: globalPct,
            streakDays: streak,
            lastUpdated: new Date().toISOString(),
            safe_message: globalPct >= 75 ? "You are safe." : "Attendance Low"
        };

        const attendanceSummary = {
            totalSessions: totalClasses,
            attended: totalAttended,
            missed: totalClasses - totalAttended,
            percentage: globalPct
        };

        return { analytics, attendanceSummary, subjectMetrics };

    } catch (err) {
        console.error('recomputeAnalyticsForStudent error', err);
        return { analytics: safeAnalyticsDefaults(), attendanceSummary: safeAttendanceSummaryDefaults(), subjectMetrics: [] };
    } finally {
        client.release();
    }
}

export async function recomputeAnalyticsForAll() {
    const client = await getClient();
    const ts = Date.now();
    const reportPath = path.join(LOG_DIR, `analytics_recompute_${ts}.json`);
    try {
        const studentsRes = await client.query('SELECT sapid FROM students');
        const out = { ts, results: [] };
        for (const s of studentsRes.rows) {
            const { analytics } = await recomputeAnalyticsForStudent(s.sapid);
            out.results.push({ sapid: s.sapid, pct: analytics.attendanceRate });
        }
        fs.writeFileSync(reportPath, JSON.stringify(out, null, 2));
        return { reportPath, summary: out };
    } finally {
        client.release();
    }
}

export async function safeStudentResponse(studentRow = {}) {
    return {
        ...studentRow,
        analytics: studentRow.analytics ?? safeAnalyticsDefaults(),
        attendanceSummary: studentRow.attendanceSummary ?? safeAttendanceSummaryDefaults(),
        subjectMetrics: studentRow.subjectMetrics ?? []
    };
}
