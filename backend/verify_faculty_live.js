
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { query } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

async function verify() {
    console.log("🚀 Verifying Faculty Live Status...");

    // 1. Create Director Token
    const token = jwt.sign({
        sapid: 'DIR_TEST',
        role: 'director',
        name: 'Director'
    }, JWT_SECRET);

    try {
        // 2. Setup Test Data (Direct DB)
        // Clean up first
        await query("DELETE FROM sessions WHERE session_id = 'SESS_TEST_LIVE'");
        await query("DELETE FROM students WHERE sapid = 'FAC_TEST_LIVE'");

        // Insert Faculty (With Password Hash)
        await query(`
            INSERT INTO students (student_id, sapid, name, email, role, designation, dept, password_hash)
            VALUES ('FAC_TEST_LIVE', 'FAC_TEST_LIVE', 'Dr. Live Test', 'live@test.com', 'faculty', 'Professor', 'STME', 'hash_123')
        `);

        // Insert Subject/Course Mapping (Required for logic)
        const subRes = await query("SELECT subject_id FROM subjects LIMIT 1");
        if (subRes.rows.length === 0) throw new Error("No subjects found in DB");
        const subject_id = subRes.rows[0].subject_id;

        const courseRes = await query("SELECT course_id FROM courses LIMIT 1");
        if (courseRes.rows.length === 0) throw new Error("No courses found in DB");
        const course_id = courseRes.rows[0].course_id;

        // Ensure faculty mapping exists so API can find him
        await query(`
            INSERT INTO course_subjects (course_id, subject_id, faculty_name)
            VALUES ($1, $2, 'Dr. Live Test')
            ON CONFLICT (course_id, subject_id) DO UPDATE SET faculty_name = 'Dr. Live Test'
        `, [course_id, subject_id]);

        // Insert LIVE Session (Current Time)
        const now = new Date();
        const start = now.toTimeString().split(' ')[0]; // HH:MM:SS
        // End time = start + 1 hour
        const endData = new Date(now.getTime() + 60 * 60 * 1000);
        const end = endData.toTimeString().split(' ')[0];

        console.log(`Creating Live Session: ${start} - ${end}`);

        await query(`
            INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, status)
            VALUES ('SESS_TEST_LIVE', $1, CURRENT_DATE, $2, $3, 'scheduled')
        `, [subject_id, start, end]);

        // 3. Call API
        const res = await fetch(`${API_BASE}/director/faculty/FAC_TEST_LIVE/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        console.log("📡 API Response Status:", res.status);
        if (data.liveStatus) {
            console.log("🟢 Live Status State:", data.liveStatus.state);
            console.log("ℹ️  Details:", data.liveStatus.details);

            if (data.liveStatus.state === 'BUSY') {
                console.log("✅ VERIFIED: System correctly detected live class.");
            } else {
                console.error("❌ FAILED: Expected BUSY, got", data.liveStatus.state);
                process.exit(1);
            }
        } else {
            console.error("❌ No liveStatus in response", data);
            process.exit(1);
        }

        // Cleanup
        await query("DELETE FROM sessions WHERE session_id = 'SESS_TEST_LIVE'");
        await query("DELETE FROM students WHERE sapid = 'FAC_TEST_LIVE'");

    } catch (e) {
        console.error("❌ Exception:", e);
        process.exit(1);
    }
}

verify();
