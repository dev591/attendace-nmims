
import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { getAllBadgesWithStatus } from '../lib/badges.js';

const router = express.Router();

/**
 * GET /student/:sapid/portfolio
 * Aggregates:
 * 1. Student Basic Info (Name, Dept, Bio)
 * 2. Skills (from student_skills)
 * 3. Verified Achievements (from achievements)
 * 4. Badges (from badge system)
 */
router.get('/:sapid/portfolio', authenticateToken, async (req, res) => {
    try {
        const { sapid } = req.params;

        // 1. Basic Info
        const studentRes = await query(`
            SELECT 
                student_id, sapid, name, dept, program, year, 
                is_onboarded, dream_company, career_goal, study_hours, linkedin_url, github_url 
            FROM students 
            WHERE sapid = $1
        `, [sapid]);
        if (studentRes.rows.length === 0) return res.status(404).json({ error: "Student not found" });
        const student = studentRes.rows[0];

        // 2. Skills
        const skillsRes = await query("SELECT id, skill_name, category, endorsements FROM student_skills WHERE student_id = $1 ORDER BY endorsements DESC", [student.student_id]);

        // 3. Verified Achievements (Timeline)
        // Only showing Approved or Pending (Pending shows "In Review")
        const achievementsRes = await query("SELECT id, title, provider, type, date_completed, status, points FROM achievements WHERE student_id = $1 ORDER BY date_completed DESC", [student.student_id]);

        // 4. Badges
        const badges = await getAllBadgesWithStatus(sapid);
        const unlockedBadges = badges.filter(b => b.is_unlocked);

        // 5. Verified Score Calc (Live)
        // Base = 100
        // Skill = +5
        // Achievement = +10
        // Badge = +20
        const skillScore = skillsRes.rows.length * 5;
        const achScore = achievementsRes.rows.filter(a => a.status === 'Approved').reduce((acc, curr) => acc + (curr.points || 0), 0);
        const badgeScore = unlockedBadges.length * 20;
        const verifiedScore = 100 + skillScore + achScore + badgeScore;

        res.json({
            student,
            verifiedScore,
            skills: skillsRes.rows,
            achievements: achievementsRes.rows,
            badges: unlockedBadges
        });

    } catch (err) {
        console.error("Portfolio Fetch Error", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /student/skill
 * Add a new skill
 */
router.post('/skill', authenticateToken, async (req, res) => {
    try {
        const { skill_name, category } = req.body;
        // Verify User
        const studentRes = await query("SELECT student_id FROM students WHERE sapid = $1", [req.user.sapid]);
        if (studentRes.rows.length === 0) return res.status(404).json({ error: "Student not found" });
        const student_id = studentRes.rows[0].student_id;

        // Check duplicate
        const dupCheck = await query("SELECT id FROM student_skills WHERE student_id = $1 AND skill_name = $2", [student_id, skill_name]);
        if (dupCheck.rows.length > 0) return res.status(400).json({ error: "Skill already added" });

        const insertRes = await query(
            "INSERT INTO student_skills (student_id, skill_name, category) VALUES ($1, $2, $3) RETURNING *",
            [student_id, skill_name, category || 'Tech']
        );

        res.status(201).json(insertRes.rows[0]);

    } catch (err) {
        console.error("Add Skill Error", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /student/skill/:id
 * Remove a skill
 */
router.delete('/skill/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Verify Ownership
        const checkRes = await query(`
            SELECT s.sapid 
            FROM student_skills ss 
            JOIN students s ON ss.student_id = s.student_id 
            WHERE ss.id = $1
        `, [id]);

        if (checkRes.rows.length === 0) return res.status(404).json({ error: "Skill not found" });

        if (checkRes.rows[0].sapid !== req.user.sapid) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await query("DELETE FROM student_skills WHERE id = $1", [id]);
        res.json({ success: true });

    } catch (err) {
        console.error("Delete Skill Error", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
