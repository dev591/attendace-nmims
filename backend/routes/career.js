
import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /student/onboarding
 * Save profile details (Onboarding Wizard)
 */
router.post('/student/onboarding', authenticateToken, async (req, res) => {
    try {
        const { dream_company, career_goal, study_hours, linkedin_url, github_url } = req.body;
        const sapid = req.user.sapid;

        const updateRes = await query(`
            UPDATE students 
            SET 
                dream_company = $1, 
                career_goal = $2, 
                study_hours = $3, 
                linkedin_url = $4, 
                github_url = $5,
                is_onboarded = TRUE 
            WHERE sapid = $6 
            RETURNING *
        `, [dream_company, career_goal, study_hours, linkedin_url, github_url, sapid]);

        if (updateRes.rowCount === 0) return res.status(404).json({ error: "Student not found" });

        res.json({ success: true, student: updateRes.rows[0] });

    } catch (err) {
        console.error("Onboarding Error", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /ai/coach
 * Generate Daily Tasks based on Goal (Rule Engine)
 */
router.get('/ai/coach', authenticateToken, async (req, res) => {
    try {
        const sapid = req.user.sapid;

        // 1. Get Student Context
        const sRes = await query("SELECT student_id, dream_company, career_goal FROM students WHERE sapid = $1", [sapid]);
        if (sRes.rows.length === 0) return res.status(404).json({ error: "Student not found" });
        const student = sRes.rows[0];
        const student_id = student.student_id;

        // 2. Check if tasks exist for today
        const today = new Date().toISOString().split('T')[0];
        const taskRes = await query("SELECT * FROM daily_tasks WHERE student_id = $1 AND date_assigned = $2", [student_id, today]);

        if (taskRes.rows.length > 0) {
            return res.json({ tasks: taskRes.rows, message: "Here are your tasks for today." });
        }

        // 3. Generate New Tasks (Mock AI Engine)
        const newTasks = generateTasksForProfile(student.dream_company, student.career_goal);

        const createdTasks = [];
        for (const t of newTasks) {
            const insert = await query(`
                INSERT INTO daily_tasks (student_id, task_text, type, date_assigned)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [student_id, t.text, t.type, today]);
            createdTasks.push(insert.rows[0]);
        }

        res.json({ tasks: createdTasks, message: "New tasks generated for you!" });

    } catch (err) {
        console.error("AI Coach Error", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /ai/task/:id/complete
 * Mark task as done
 */
router.post('/ai/task/:id/complete', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Verify ownership via join (optional but safe)
        // For mvp just update
        await query("UPDATE daily_tasks SET is_completed = TRUE WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- MOCK AI ENGINE ---
function generateTasksForProfile(company, goal) {
    const tasks = [];
    const c = (company || "").toLowerCase();
    const g = (goal || "").toLowerCase();

    // 1. Coding Task
    if (c.includes('google') || c.includes('faang') || c.includes('microsoft')) {
        tasks.push({ text: "Solve 'Two Sum' on LeetCode (Optimized)", type: 'code' });
    } else if (g.includes('data')) {
        tasks.push({ text: "Practice SQL Joins on HackerRank", type: 'code' });
    } else {
        tasks.push({ text: "Write a function to reverse a string", type: 'code' });
    }

    // 2. Learning Task
    if (g.includes('frontend') || g.includes('react')) {
        tasks.push({ text: "Read about React 19 Server Components", type: 'learn' });
    } else if (g.includes('backend') || g.includes('node')) {
        tasks.push({ text: "Learn about Node.js Event Loop phases", type: 'learn' });
    } else {
        tasks.push({ text: "Read one tech article on Medium", type: 'learn' });
    }

    // 3. Project/Soft Skill Task
    tasks.push({ text: "Update your LinkedIn Headline", type: 'project' });

    return tasks;
}

export default router;
