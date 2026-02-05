
import { getClient } from './db.js';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:4000';
const SAPID = '50012999999'; // Test User
const SECRET = process.env.JWT_SECRET || 'antigravity_secret_key_8823';

async function runTest() {
    const client = await getClient();
    try {
        console.log("🚀 Starting Career Copilot Verification...");

        // 1. Reset Test User (Ensure Exists)
        await client.query(`
            INSERT INTO students (student_id, sapid, password_hash, name, program, dept, year)
            VALUES ('test_id', $1, 'hash', 'Career Tester', 'B.Tech', 'CS', 3)
            ON CONFLICT (sapid) DO UPDATE SET is_onboarded = FALSE, dream_company = NULL
        `, [SAPID]);

        await client.query("DELETE FROM daily_tasks WHERE student_id = (SELECT student_id FROM students WHERE sapid = $1)", [SAPID]);
        console.log("✅ Reset/Seeded Test User State");

        // 2. Login
        const token = jwt.sign({ sapid: SAPID, id: 'test_id', role: 'student' }, SECRET);
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 3. Test Onboarding
        console.log("👉 Testing POST /student/onboarding...");
        const onboardRes = await fetch(`${API_URL}/student/onboarding`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                dream_company: 'Google',
                career_goal: 'Software Engineer',
                study_hours: '3+ hours',
                linkedin_url: 'linkedin.com/in/test',
                github_url: 'github.com/test'
            })
        });

        const onboardData = await onboardRes.json();

        if (onboardRes.ok && onboardData.student.dream_company === 'Google') {
            console.log("✅ Onboarding Successful (DB Updated)");
        } else {
            console.error("❌ Onboarding Failed", onboardData);
            process.exit(1);
        }

        // 4. Test AI Coach (Task Generation)
        console.log("👉 Testing GET /ai/coach (Expect Google/Code tasks)...");
        const coachRes = await fetch(`${API_URL}/ai/coach`, { headers });
        const coachData = await coachRes.json();
        const tasks = coachData.tasks;

        console.log(`   Received ${tasks.length} tasks.`);
        const hasGoogleTask = tasks.some(t => t.task_text.includes("LeetCode") && t.type === 'code');

        if (hasGoogleTask) {
            console.log("✅ AI Coach Logic Verified (Generated LeetCode task for Google goal)");
        } else {
            console.error("❌ AI Coach Logic Failed (No specific task found)", tasks);
            process.exit(1);
        }

        // 5. Test Task Completion
        const taskId = tasks[0].id;
        console.log(`👉 Testing Task Completion (ID: ${taskId})...`);
        await fetch(`${API_URL}/ai/task/${taskId}/complete`, {
            method: 'POST',
            headers
        });

        // Verify in DB
        const dbTask = await client.query("SELECT is_completed FROM daily_tasks WHERE id = $1", [taskId]);
        if (dbTask.rows[0].is_completed) {
            console.log("✅ Task Marked Completed in DB");
        } else {
            console.error("❌ Task Completion Failed in DB");
        }

        console.log("\n🎉 ALL CHECKS PASSED!");

    } catch (err) {
        console.error("❌ Test Failed:", err.message);
    } finally {
        client.release();
        process.exit();
    }
}

runTest();
