
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Gemini
const GEMINI_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (GEMINI_KEY && GEMINI_KEY.length > 5) {
    genAI = new GoogleGenerativeAI(GEMINI_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} else {
    console.warn("⚠️ GEMINI_API_KEY missing or invalid. Using Mock AI Mode.");
}

// Rate Limit Constants
const DAILY_LIMIT = 20;

/**
 * Middleware: Check Rate Limit
 */
const checkRateLimit = async (req, res, next) => {
    try {
        const studentId = req.user.student_id;

        // Ensure student columns exist (migration might be partial) or just handle safely
        // But assuming columns exist from previous migration step

        const usageRes = await query(`
            SELECT ai_usage_count, last_ai_usage_date, student_id 
            FROM students WHERE sapid = $1
        `, [req.user.sapid]);

        const user = usageRes.rows[0];
        const today = new Date().toISOString().split('T')[0];
        const lastUsage = new Date(user.last_ai_usage_date).toISOString().split('T')[0];

        // Reset if new day
        if (lastUsage !== today) {
            await query("UPDATE students SET ai_usage_count = 0, last_ai_usage_date = CURRENT_DATE WHERE student_id = $1", [user.student_id]);
            req.usageCount = 0;
        } else {
            req.usageCount = user.ai_usage_count || 0;
        }

        if (req.usageCount >= DAILY_LIMIT) {
            return res.status(429).json({ error: "Daily AI limit reached. Come back tomorrow!" });
        }

        next();
    } catch (err) {
        console.error("Rate Limit Error", err);
        next(); // Fail open if DB error, or block? Let's fail open for better UX in MVP
    }
};

/**
 * Helper: Increment Usage
 */
const incrementUsage = async (sapid) => {
    await query("UPDATE students SET ai_usage_count = ai_usage_count + 1 WHERE sapid = $1", [sapid]);
};

/**
 * POST /ai/chat
 * Chat with Career Copilot
 * Body: { message, context: { current_role, skills, goals } }
 */
router.post('/chat', authenticateToken, checkRateLimit, async (req, res) => {
    try {
        const { message, context } = req.body;
        const sapid = req.user.sapid;

        // 1. Check Cache (Simple exact match for now, vector search is overkill for MVP)
        // Normalizing: Lowercase + trim
        const cacheKey = `chat:${message.trim().toLowerCase()}`;
        const cacheRes = await query("SELECT response FROM ai_response_cache WHERE cache_key = $1", [cacheKey]);

        if (cacheRes.rows.length > 0) {
            console.log("Serving from Cache ⚡️");
            // Don't increment usage for cached hits? Or do we? Let's say cached hits are free!
            return res.json({ response: cacheRes.rows[0].response, cached: true });
        }

        // 2. Build Prompt
        const prompt = `
            You act as a world-class 'Career Coach' for a university student.
            Student Profile:
            - Goal: ${context?.career_goal || 'Not set'}
            - Recent Skills: ${context?.skills?.map(s => s.skill_name).join(', ') || 'None'}
            - Dream Company: ${context?.dream_company || 'Not set'}

            User Question: "${message}"

            Answer in a helpful, motivating, and concise manner (max 3 sentences).
            Suggest a specific concrete action if applicable.
        `;

        // 3. Call Gemini
        // 3. Call Gemini (or Mock)
        let response;
        if (model) {
            const result = await model.generateContent(prompt);
            response = result.response.text();
        } else {
            // MOCK FALLBACK
            const mocks = [
                "That's a great goal! To prepare for " + (context?.dream_company || 'your dream job') + ", focus on building a strong portfolio.",
                "Have you tried networking with alumni? It's often the fastest way to get noticed.",
                "Make sure your resume highlights your impact, not just your duties.",
                "I'd recommend practicing behavioral interview questions using the STAR method."
            ];
            response = mocks[Math.floor(Math.random() * mocks.length)] + " (Mock AI Mode)";
            await new Promise(r => setTimeout(r, 1000)); // Simulate delay
        }

        // 4. Save to Cache
        await query(
            "INSERT INTO ai_response_cache (cache_key, response) VALUES ($1, $2) ON CONFLICT (cache_key) DO NOTHING",
            [cacheKey, response]
        );

        // 5. Update Usage (Real API Call made)
        await incrementUsage(sapid);

        res.json({ response, cached: false });

    } catch (err) {
        console.error("AI Chat Error Details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        res.status(500).json({ error: "AI Service Unavailable: " + err.message });
    }
});

/**
 * POST /ai/generate-tasks
 * Generate Daily Quests based on goal
 */
router.post('/generate-tasks', authenticateToken, checkRateLimit, async (req, res) => {
    try {
        const sapid = req.user.sapid;

        // 1. Get Full Student Context
        const studentRes = await query(`
            SELECT s.*, 
                   (SELECT json_agg(skill_name) FROM student_skills WHERE student_id = s.student_id) as skills
            FROM students s WHERE s.sapid = $1
        `, [sapid]);
        const student = studentRes.rows[0];

        // 2. Check if tasks already exist for today
        const existingTasks = await query(`
            SELECT id FROM daily_tasks 
            WHERE student_id = $1 AND assigned_date = CURRENT_DATE
        `, [student.student_id]);

        if (existingTasks.rows.length > 0) {
            return res.json({ message: "Tasks already generated for today", tasks: existingTasks.rows });
        }

        // 3. Generate with Gemini
        const prompt = `
            Generate 3 "Daily Tasks" for a student targeting: ${student.career_goal || 'Software Engineer'}.
            Their current skills: ${student.skills || 'None'}.
            Target Company: ${student.dream_company || 'Any Top Tech'}.

            Return JSON ONLY:
            [
                { "task_text": "Solve Leetcode: Two Sum", "type": "code", "xp": 20 },
                { "task_text": "Read Article: React Hooks", "type": "learn", "xp": 10 },
                { "task_text": "Update LinkedIn Bio", "type": "soft-skill", "xp": 15 }
            ]
        `;

        let text;
        if (model) {
            const result = await model.generateContent(prompt);
            text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        } else {
            // MOCK FALLBACK
            const mockTasks = [
                { "task_text": "Draft a cover letter for " + (student.dream_company || 'Tech Corp'), "type": "soft-skill", "xp": 15 },
                { "task_text": "Solve 1 Medium Leetcode problem", "type": "code", "xp": 20 },
                { "task_text": "Read about System Design basics", "type": "learn", "xp": 10 }
            ];
            text = JSON.stringify(mockTasks);
            await new Promise(r => setTimeout(r, 1500));
        }
        const tasks = JSON.parse(text);

        // 4. Insert into DB
        for (const task of tasks) {
            await query(`
                INSERT INTO daily_tasks (student_id, task_text, type, xp_reward, assigned_date)
                VALUES ($1, $2, $3, $4, CURRENT_DATE)
            `, [student.student_id, task.task_text, task.type, task.xp || 10]);
        }

        await incrementUsage(sapid);

        res.json({ success: true, count: tasks.length });

    } catch (err) {
        console.error("Task Gen Error", err);
        res.status(500).json({ error: err.message });
    }
});

// Get daily tasks
router.get('/tasks', authenticateToken, async (req, res) => {
    try {
        const studentRes = await query("SELECT student_id FROM students WHERE sapid = $1", [req.user.sapid]);
        const tasks = await query(`
            SELECT * FROM daily_tasks 
            WHERE student_id = $1 AND assigned_date = CURRENT_DATE
            ORDER BY is_completed ASC
        `, [studentRes.rows[0].student_id]);

        res.json(tasks.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
