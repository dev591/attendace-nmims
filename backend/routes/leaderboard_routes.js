import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /student/leaderboard
 * Returns Top 5 Students by Attendance Percentage.
 * Strict "No Mock Data" Policy.
 */
router.get('/student/leaderboard', authenticateToken, async (req, res) => {
    try {
        const { dept, category } = req.query; // category: 'academic' | 'skills' | 'overall'

        // Base Query
        let whereClause = '';
        const params = [];
        if (dept && dept !== 'All') {
            whereClause = 'WHERE s.dept = $1';
            params.push(dept);
        }

        // 1. Fetch Candidates (Top 20 candidates relevant to filtering)
        // We calculate detailed XP for potential leaders
        const candidatesRes = await query(`
            SELECT 
                s.student_id as id, 
                s.name,
                s.dept,
                ROUND(AVG(CASE WHEN a.present THEN 1.0 ELSE 0.0 END) * 100, 1) as attendance_pct
            FROM students s
            JOIN attendance a ON s.student_id = a.student_id
            ${whereClause}
            GROUP BY s.student_id, s.name, s.dept
            HAVING COUNT(a.att_id) > 0
            ORDER BY attendance_pct DESC
            LIMIT 20
        `, params);

        // 2. Enrich with Skills & Streaks (Parallel)
        const enriched = await Promise.all(candidatesRes.rows.map(async (st) => {
            // A. Skill XP
            const skillRes = await query(`SELECT COUNT(*) as count FROM student_skills WHERE student_id = $1`, [st.id]);
            const skillCount = parseInt(skillRes.rows[0].count || 0);
            const skillXP = skillCount * 150; // 150 XP per skill

            // B. Academic XP
            const academicXP = Math.round(parseFloat(st.attendance_pct) * 10); // 75% = 750 XP

            // C. Streak (Simplified 30-day lookback)
            // Query last 30 days of attendance for this student
            const attRes = await query(`
                SELECT s.date, a.present
                FROM attendance a 
                JOIN sessions s ON a.session_id = s.session_id
                WHERE a.student_id = $1 AND s.date <= CURRENT_DATE
                ORDER BY s.date DESC 
                LIMIT 30
            `, [st.id]);

            let streak = 0;
            // Iterate dates. We need strictly consecutive days? 
            // Or just consecutive sessions attended? Usually "Streak" = "Consecutive Sessions Attended" for students.
            // Let's go with consecutive SESSIONS present.
            for (const row of attRes.rows) {
                if (row.present) streak++;
                else break;
            }

            return {
                id: st.id,
                name: formatName(st.name),
                dept: st.dept,
                academic_xp: academicXP,
                skill_xp: skillXP,
                total_xp: academicXP + skillXP,
                streak,
                score: parseFloat(st.attendance_pct), // Legacy support
                isUser: st.id === req.user.student_id
            };
        }));

        // 3. Sort & Filter
        let sorted = enriched;
        if (category === 'skills') {
            sorted = enriched.sort((a, b) => b.skill_xp - a.skill_xp);
        } else if (category === 'academic') {
            sorted = enriched.sort((a, b) => b.academic_xp - a.academic_xp);
        } else {
            // Overall
            sorted = enriched.sort((a, b) => b.total_xp - a.total_xp);
        }

        // Return Top 5
        res.json(sorted.slice(0, 5));

    } catch (err) {
        console.error("Leaderboard Error:", err);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});

// Privacy: Mask last name
function formatName(fullName) {
    if (!fullName) return 'Student';
    const parts = fullName.split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1][0]}.`;
}

export default router;
