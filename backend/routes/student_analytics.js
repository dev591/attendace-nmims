
import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { recomputeAnalyticsForStudent } from '../lib/analytics.js';

const router = express.Router();

/**
 * GET /student/:sapid/analytics/deep
 * Advanced Analytics: Trends, Peer Rank, Safe Bunks
 */
router.get('/:sapid/analytics/deep', authenticateToken, async (req, res) => {
    try {
        const { sapid } = req.params;

        // Security Check: Users can only view their own analytics unless Director/Admin
        if (req.user.role === 'student' && req.user.sapid !== sapid) {
            return res.status(403).json({ error: "Unauthorized access to analytics" });
        }

        // 1. Fetch Basic Analytics (Reuse existing robust logic)
        console.log(`[Deep Analytics] Recomputing for ${sapid}`);
        const { analytics, subjectMetrics } = await recomputeAnalyticsForStudent(sapid);
        const myPct = analytics.attendanceRate;
        console.log(`[Deep Analytics] Got metrics for ${subjectMetrics?.length} subjects`);

        // 2. Peer Comparison (Percentile Rank)
        // Comparison Scope: Same Dept + Year
        const studentRes = await query("SELECT dept, year FROM students WHERE sapid = $1", [sapid]);
        let peerRank = { percentile: 0, message: "Not enough data for peer comparison" };

        if (studentRes.rows.length > 0) {
            const { dept, year } = studentRes.rows[0];
            // Get all students stats in this cohort
            // NOTE: Computing this live for everyone is heavy. In PROD, this should be cached/materialized.
            // For MVP (Zero Mock), we compute it broadly or use a simplified query.
            // We'll aggregate sessions for all students in cohort.

            const cohortStats = await query(`
                WITH cohort_stats AS (
                    SELECT 
                        st.student_id,
                        (COUNT(CASE WHEN a.present THEN 1 END)::numeric / NULLIF(COUNT(s.session_id), 0)) * 100 as pct
                    FROM students st
                    JOIN enrollments e ON st.student_id = e.student_id
                    JOIN sessions s ON e.subject_id = s.subject_id
                    LEFT JOIN attendance a ON s.session_id = a.session_id AND e.student_id = a.student_id
                    WHERE st.dept = $1 AND st.year = $2 AND s.status = 'conducted'
                    GROUP BY st.student_id
                )
                SELECT pct FROM cohort_stats
            `, [dept, year]);

            const scores = cohortStats.rows.map(r => parseFloat(r.pct || 0));
            if (scores.length > 1) {
                const belowMe = scores.filter(s => s < myPct).length;
                const percentile = Math.round((belowMe / scores.length) * 100);
                peerRank = {
                    percentile,
                    message: percentile > 50
                        ? `You are in the top ${100 - percentile}% of your class.`
                        : `You are in the bottom ${percentile}%. Push harder!`
                };
            }
        }

        // 3. Monthly Trends
        const trendsRes = await query(`
            SELECT 
                TO_CHAR(s.date, 'Mon') as month, 
                EXTRACT(MONTH FROM s.date) as m_num,
                COUNT(*) as total,
                COUNT(CASE WHEN a.present THEN 1 END) as attended
            FROM sessions s
            JOIN attendance a ON s.session_id = a.session_id
            JOIN students st ON a.student_id = st.student_id
            WHERE st.sapid = $1
            AND s.status = 'conducted'
            AND s.date >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY TO_CHAR(s.date, 'Mon'), EXTRACT(MONTH FROM s.date)
            ORDER BY EXTRACT(MONTH FROM s.date)
        `, [sapid]);

        const monthlyTrends = trendsRes.rows.map(r => ({
            month: r.month,
            pct: r.total > 0 ? Math.round((parseInt(r.attended) / parseInt(r.total)) * 100) : 0
        }));

        // 4. Predictive Intelligence: Safe Bunks & Risk Timeline
        const predictions = [];

        for (const sub of subjectMetrics) {
            const P = parseInt(sub.units_attended || 0);
            const T = parseInt(sub.units_total || 0);

            // A. Risk Buffer (How many can I miss?)
            // Solve: P / (T + x) = 0.75  =>  P = 0.75T + 0.75x  =>  x = (P - 0.75T) / 0.75
            let safe_bunks = 0;
            let danger_in = 0;
            let recovery_needed = 0;

            if (T === 0) {
                safe_bunks = 10; // New semester
            } else {
                const buffer = (P - 0.75 * T) / 0.75;
                if (buffer >= 0) {
                    safe_bunks = Math.floor(buffer);
                    danger_in = safe_bunks + 1; // You hit danger on the (x+1)th bunk
                } else {
                    // Already in danger. How many to attend to recover?
                    // Solve: (P + y) / (T + y) = 0.75  => P + y = 0.75T + 0.75y  => 0.25y = 0.75T - P => y = (0.75T - P) / 0.25
                    const recovery = (0.75 * T - P) / 0.25;
                    recovery_needed = Math.ceil(Math.max(0, recovery));
                }
            }

            // B. Timeline Query (Find valid future dates)
            // Ideally we query DB for future sessions for this subject
            // For MVP speed (avoiding N+1 DB calls if possible, but let's do one localized query or just simple estimation if DB is heavy)
            // Let's try to fetch future sessions for this student's enrolled subjects in one go? 
            // Or just do a lightweight query per subject for the "Top 3" relevant ones.
            // Let's do a simple estimation based on "next session date" if we don't have full calendar.
            // Actually, we can fetch future sessions easily.

            predictions.push({
                subject: sub.subject_name,
                code: sub.subject_code,
                percentage: sub.attendanceRate,
                safe_bunks,
                danger_in,
                recovery_needed,
                status: safe_bunks > 0 ? 'SAFE' : (safe_bunks === 0 ? 'BORDERLINE' : 'DANGER')
            });
        }

        // Fetch Future Sessions for Timeline (SAFE BUNK UNTIL...)
        // We need next session dates for the 'SAFE' subjects.
        // Optimization: Only fetch for subjects where safe_bunks > 0 and < 10 (reasonable range)
        const safeSubjects = predictions.filter(p => p.safe_bunks > 0 && p.safe_bunks < 20).map(p => p.code);

        const timelineMap = {};
        if (safeSubjects.length > 0) {
            // Get future sessions for these subjects
            const futureRes = await query(`
                SELECT s.subject_id, sub.code, s.date
                FROM sessions s
                JOIN subjects sub ON s.subject_id = sub.subject_id
                JOIN enrollments e ON sub.subject_id = e.subject_id
                JOIN students st ON e.student_id = st.student_id
                WHERE st.sapid = $1
                AND sub.code = ANY($2)
                AND s.date > CURRENT_DATE
                AND s.status = 'scheduled'
                ORDER BY s.date ASC
            `, [sapid, safeSubjects]);

            // Map standard array to subject
            const subjectDates = {};
            futureRes.rows.forEach(row => {
                if (!subjectDates[row.code]) subjectDates[row.code] = [];
                subjectDates[row.code].push(row.date);
            });

            // Calculate "Use By" date
            predictions.forEach(p => {
                if (p.safe_bunks > 0 && subjectDates[p.code]) {
                    const dates = subjectDates[p.code];
                    // If I have 3 safe bunks, I can skip dates[0], dates[1], dates[2]. 
                    // My "Safe Until" is the date BEFORE dates[3]? Or "You are free until dates[safe_bunks]"?
                    // "Bunk freely till X" usually means X is the last date you can skip?
                    // Let's say: "You can skip classes until [Date of Nth Session]".
                    const targetIndex = Math.min(dates.length - 1, p.safe_bunks - 1);
                    if (targetIndex >= 0) {
                        p.safe_until = dates[targetIndex]; // The date of the last class you can afford to miss
                    }
                }
            });
        }

        res.json({
            peerRank,
            monthlyTrends,
            predictions,
            overallPct: myPct
        });

    } catch (err) {
        console.error("Deep Analytics Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
