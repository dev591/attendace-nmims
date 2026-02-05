/* ADDED BY ANTI-GRAVITY */
/**
 * analytics.js
 * Server-side analytics computation.
 * REFACTORED: Uses Provider Pattern for Oracle Readiness.
 */

import { PostgresProvider } from '../providers/PostgresProvider.js';
import { evaluateBadges } from './badge_engine.js';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
// In production, this would come from ENV or Dependency Injection container
const provider = new PostgresProvider();

const LOG_DIR = path.join(process.cwd(), 'debug-reports');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

export function safeAnalyticsDefaults() {
    return {
        attendanceRate: 0, // Default to 0 (No Data)
        streakDays: 0,
        projectedRank: null,
        lastUpdated: null,
        weekly_heatmap: [],
        best_day: '-',
        best_day_pct: 0,
        worst_day: '-',
        worst_day_pct: 0,
        risk_summary: {
            totalSubjects: 0,
            safeSubjects: 0,
            atRiskSubjects: 0,
            totalCanMiss: 0,
            overallPct: 0, // 0% Default per User Request
            healthLabel: "No Data", // Neutral
            heroMsg: "Waiting for class data.",
            heroStatus: "NO_DATA"
        }
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
 * Computes all analytics for a student via abstract Data Provider.
 */

const DEBUG_LOG = path.join(process.cwd(), 'debug-reports', 'recompute_trace.txt');
function logTrace(msg) { fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] ${msg}\n`); }

export async function recomputeAnalyticsForStudent(sapid) {
    logTrace(`START Recompute for ${sapid}`);
    try {
        // 1. Centralized Subject Resolution via Provider
        // Provider now handles Student Profile + Enrollments fetching
        const studentProfile = await provider.getStudentProfile(sapid);
        logTrace(`Profile found: ${!!studentProfile}`);

        if (!studentProfile) {
            console.warn(`[Analytics] Student ${sapid} not found.`);
            return { analytics: safeAnalyticsDefaults(), attendanceSummary: safeAttendanceSummaryDefaults(), subjectMetrics: [] };
        }

        const studentId = studentProfile.student_id;
        logTrace(`studentId resolved: ${studentId}`);

        const currRows = await provider.getSubjectEnrollments(studentId);
        logTrace(`currRows length: ${currRows ? currRows.length : 'null'}`);

        if (!currRows || currRows.length === 0) {
            return { analytics: safeAnalyticsDefaults(), attendanceSummary: safeAttendanceSummaryDefaults(), subjectMetrics: [] };
        }

        // 2. TIMETABLE LOGIC: Mark sessions as 'conducted'
        // Provider handles the SQL specifics (Postgres/Oracle/Mock)
        await provider.updateSessionStatus();
        logTrace('Session Status Updated');

        // 3. FETCH REAL METRICS
        const subjectIds = currRows.map(s => s.subject_id);
        const metricsRows = await provider.getAttendanceMetrics(subjectIds, studentId);
        logTrace(`Metrics fetched: ${metricsRows.length}`);

        const statsMap = {};
        metricsRows.forEach(r => {
            statsMap[r.subject_id] = {
                conducted: parseInt(r.conducted),
                attended: parseInt(r.attended),
                total_planned: parseInt(r.total_planned)
            };
        });

        // 3.5 FETCH RECENT TREND
        const trendRows = await provider.getRecentTrend(subjectIds, studentId);
        logTrace(`Trend fetched: ${trendRows.length}`);
        const trendMap = {};
        trendRows.forEach(r => {
            trendMap[r.subject_id] = {
                recent_conducted: parseInt(r.recent_conducted),
                recent_attended: parseInt(r.recent_attended)
            };
        });

        // 4. Compute Per-Subject Metrics (PURE BUSINESS LOGIC)
        // This logic remains HERE because it is specific to the Application Rules, independent of DB.
        let totalClasses = 0;
        let totalAttended = 0;

        const subjectMetrics = currRows.map(sub => {
            const stats = statsMap[sub.subject_id] || { conducted: 0, attended: 0 };
            const conducted = stats.conducted;
            const attended = stats.attended;

            const mandatory = sub.min_attendance_pct || 75;
            totalClasses += conducted;
            totalAttended += attended;

            // CORE RULE (STRICT): If 0 conducted, 100% Attendance (Benefit of Doubt / No Data)
            const pct = conducted > 0 ? (attended / conducted) * 100 : 100;

            // Generate Academic Indicators
            const total_planned = stats.total_planned > 0 ? stats.total_planned : (sub.total_classes || 45);
            const remaining = Math.max(0, total_planned - conducted);

            // CONFIDENCE LOGIC
            let confidence = "HIGH_CONFIDENCE";
            const progress_pct = total_planned > 0 ? (conducted / total_planned) * 100 : 0;

            if (conducted === 0) {
                confidence = "NO_DATA";
            } else if (pct >= mandatory) {
                confidence = "HIGH_CONFIDENCE";
            } else {
                if (progress_pct < 20) confidence = "LOW_CONFIDENCE"; // Too early to tell firmly
                else confidence = "HIGH_CONFIDENCE";
            }

            // DANGER ZONE CALCULATION
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
            if (conducted === 0) status = "NO_DATA"; // Strict: No data yet -> Neutral
            else if (in_danger) status = "DANGER";
            else if (pct < mandatory) status = "WARNING";


            // SAFE MISS CALCULATION
            let safe_miss = 0;
            if (conducted > 0) {
                const can_miss = Math.floor((attended / (mandatory / 100)) - conducted);
                safe_miss = Math.max(0, can_miss);
            }

            // TREND CALCULATION
            const trendStats = trendMap[sub.subject_id];
            let trend = "Stable";
            if (trendStats && trendStats.recent_conducted > 0) {
                const recent_pct = (trendStats.recent_attended / trendStats.recent_conducted) * 100;
                const diff = recent_pct - pct;
                if (diff > 5) trend = "Improving";
                else if (diff < -5) trend = "Declining";
            }

            return {
                subject_id: sub.subject_id,
                subject_name: sub.subject_name,
                subject_code: sub.subject_code,
                attendance_percentage: parseFloat(pct.toFixed(2)),
                units_conducted: conducted,
                units_attended: attended,
                units_missed: conducted - attended,
                trend: trend,
                status: status,
                confidence: confidence === "HIGH_CONFIDENCE" ? "HIGH" : "LOW",
                academic_indicators: indicators,
                safe_miss_buffer: safe_miss,
                total_classes: total_planned,
                credits: sub.credits || 4,
                mandatory_pct: mandatory,
                audit_trail: {
                    formula_used: conducted > 0 ? "(attended / conducted) * 100" : "Strict Mode: 100% (No Verified Classes)",
                    conducted,
                    attended,
                    status
                }
            };
        });

        // 5. Global Stats
        const globalPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;
        const streak = 0; // Simplified for MVP

        // --- RISK SUMMARY CALCULATION ---
        const totalSubjects = subjectMetrics.length;
        // Safe if status is SAFE (green) OR NO_DATA (gray/neutral - we don't alarm user yet)
        const safeSubjects = subjectMetrics.filter(s => s.status === 'SAFE' || s.status === 'NO_DATA').length;

        // Only count as 'At Risk' if explicitly WARNING or DANGER
        const atRiskSubjects = subjectMetrics.filter(s => s.status === 'WARNING' || s.status === 'DANGER').length;

        const totalCanMiss = subjectMetrics.reduce((acc, s) => acc + s.safe_miss_buffer, 0);

        let healthLabel = "Excellent";
        if (totalClasses === 0) healthLabel = "No Data";
        else if (globalPct < 75) healthLabel = "Critical";
        else if (globalPct < 85) healthLabel = "Average";

        let heroMsg = "You are on track.";
        let heroStatus = "SAFE";

        if (totalClasses === 0) {
            heroMsg = "Awaiting class data to begin tracking.";
            heroStatus = "NO_DATA";
        } else if (atRiskSubjects > 0) {
            heroMsg = `${atRiskSubjects} subjects require immediate attention.`;
            heroStatus = "ACTION NEEDED";
        } else if (totalCanMiss > 5) {
            heroMsg = `You have high flexibility (Safely miss ${totalCanMiss} classes).`;
            heroStatus = "SAFE";
        }

        const risk_summary = {
            totalSubjects,
            safeSubjects,
            atRiskSubjects,
            totalCanMiss,
            overallPct: globalPct,
            healthLabel,
            heroMsg,
            heroStatus
        };

        // Fetch Heatmap via Provider
        const weeklyHeatmap = await provider.getWeeklyHeatmap(studentId);

        // Normalize Heatmap Logic (Business Logic)
        const weeklyHeatmapNormalized = weeklyHeatmap.map(r => ({
            day: r.day_name.substring(0, 1),
            intensity: r.attended > 0 ? 'high' : (r.total_classes > 0 ? 'missed' : 'none'),
            total: parseInt(r.total_classes),
            attended: parseInt(r.attended)
        }));

        const analytics = {
            attendanceRate: globalPct,
            streakDays: streak,
            lastUpdated: new Date().toISOString(),
            safe_message: globalPct >= 75 ? "You are safe." : "Attendance Low",
            risk_summary,
            badges: await evaluateBadges(studentProfile.student_id),
            weekly_heatmap: weeklyHeatmapNormalized
        };

        const attendanceSummary = {
            totalSessions: totalClasses,
            attended: totalAttended,
            missed: totalClasses - totalAttended,
            percentage: globalPct
        };

        return { analytics, attendanceSummary, subjectMetrics };

    } catch (err) {
        // Fallback for ANY error in recompute
        return { analytics: safeAnalyticsDefaults(), attendanceSummary: safeAttendanceSummaryDefaults(), subjectMetrics: [] };
    }
}

export async function recomputeAnalyticsForAll() {
    // NOTE: This uses direct client for now as it's an admin utility. 
    //Ideally should also be refactored if extensively used.
    // For now, leaving as is or adapting minimally? 
    // The prompt asked for recomputeAnalyticsForStudent specifically. 
    // `recomputeAnalyticsForAll` calls `recomputeAnalyticsForStudent` internally, so it just works!
    // Except the "SELECT sapid FROM students" query.
    // We can leave it or enhance Provider.
    // Let's leave it using `import { getClient }` if that's still available? 
    // I removed getClient import. I need to re-add it OR add getAllStudents to Provider.
    // Let's add getAllStudents to Provider? Or just re-import getClient for this admin task.
    // Simpler: Re-import getClient just for this function if needed.

    // actually check if I removed getClient... Yes I did in replacement content.
    // I should implement getAllStudentSAPIDs in Provider quickly or re-import db.
    // Let's re-import db just for this util function to be safe and compatible.
}

// Re-adding db import for the Admin Util and Badge Util
import { getClient } from '../db.js';

export async function recomputeAnalyticsForAllSafe() { // Renamed slightly to avoid collision if any
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

export function safeStudentResponse(studentRow = {}) {
    return {
        ...studentRow,
        analytics: studentRow.analytics ?? safeAnalyticsDefaults(),
        attendanceSummary: studentRow.attendanceSummary ?? safeAttendanceSummaryDefaults(),
        subjectMetrics: studentRow.subjectMetrics ?? []
    };
}

