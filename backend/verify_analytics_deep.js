
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { query } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

async function verify() {
    console.log("🚀 Verifying Deep Analytics...");

    try {
        // 1. Setup Test Cohort (Dept=TEST_ANALYTICS, Year=1)
        // Cleanup
        await query("DELETE FROM sessions WHERE subject_id = 'SUB_TEST_A'");
        await query("DELETE FROM enrollments WHERE student_id LIKE 'TEST_ST_%'");
        await query("DELETE FROM students WHERE dept = 'TEST_ANALYTICS'");
        await query("DELETE FROM subjects WHERE subject_id = 'SUB_TEST_A'");

        // Create Subject
        await query("INSERT INTO subjects (subject_id, code, name) VALUES ('SUB_TEST_A', 'TEST101', 'Analytics 101')");

        // Create 3 Students
        // Student A: High Attendance (10/10)
        // Student B: Mid Attendance (5/10)
        // Student C: Low Attendance (1/10) -- THIS IS US

        const students = [
            { id: 'TEST_ST_A', name: 'Topper' },
            { id: 'TEST_ST_B', name: 'Average' },
            { id: 'TEST_ST_C', name: 'Failer' }
        ];

        for (const s of students) {
            await query(`
                INSERT INTO students (student_id, sapid, name, dept, year, role, password_hash)
                VALUES ($1, $1, $2, 'TEST_ANALYTICS', 1, 'student', 'hash')
            `, [s.id, s.name]);

            await query("INSERT INTO enrollments (student_id, subject_id) VALUES ($1, 'SUB_TEST_A')", [s.id]);
        }

        // Create 10 Conducted Sessions
        for (let i = 1; i <= 10; i++) {
            await query(`
                INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, status)
                VALUES ($1, 'SUB_TEST_A', CURRENT_DATE - INTERVAL '${i} day', '10:00', '11:00', 'conducted')
            `, [`SESS_TEST_${i}`]);
        }

        // Mark Attendance
        // A: 10/10 present
        for (let i = 1; i <= 10; i++) {
            await query("INSERT INTO attendance (session_id, student_id, present) VALUES ($1, 'TEST_ST_A', true)", [`SESS_TEST_${i}`]);
        }
        // B: 5/10 present
        for (let i = 1; i <= 5; i++) {
            await query("INSERT INTO attendance (session_id, student_id, present) VALUES ($1, 'TEST_ST_B', true)", [`SESS_TEST_${i}`]);
        }
        // C: 1/10 present
        await query("INSERT INTO attendance (session_id, student_id, present) VALUES ('SESS_TEST_1', 'TEST_ST_C', true)");

        // 2. Call API as Student C (Failer)
        // Expected Rank: Bottom %
        const token = jwt.sign({ sapid: 'TEST_ST_C', role: 'student' }, JWT_SECRET);

        const res = await fetch(`${API_BASE}/student/TEST_ST_C/analytics/deep`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        console.log("📡 API Response:", JSON.stringify(data, null, 2));

        // 3. Assertions
        if (data.peerRank) {
            console.log(`✅ Peer Rank Percentile: ${data.peerRank.percentile}%`);
            // There are 3 students. 
            // A=100%, B=50%, C=10%
            // Below C = 0 students.
            // Percentile = (0 / 3) * 100 = 0%.

            if (data.peerRank.percentile < 20) {
                console.log("✅ Verified: Correctly identified as bottom tier.");
            } else {
                console.error("❌ Mismatch: Expected low percentile for failer.");
            }
        } else {
            console.error("❌ Missing peerRank in response");
        }

        if (data.monthlyTrends) {
            console.log("✅ Trends Data Present");
        }

    } catch (e) {
        console.error("❌ Verify Error:", e);
    } finally {
        // Cleanup (Reverse Order of Dependencies)
        await query("DELETE FROM attendance WHERE student_id LIKE 'TEST_ST_%'");
        await query("DELETE FROM enrollments WHERE student_id LIKE 'TEST_ST_%'");
        await query("DELETE FROM sessions WHERE subject_id = 'SUB_TEST_A'");
        await query("DELETE FROM students WHERE dept = 'TEST_ANALYTICS'");
        await query("DELETE FROM subjects WHERE subject_id = 'SUB_TEST_A'");
    }
}

verify();
