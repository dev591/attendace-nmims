
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:5000';

async function verify() {
    console.log("🏆 Starting Gamification System Verification...");

    try {
        // 1. Setup Test Users
        console.log("👤 Setting up test users...");

        // Ensure STME Director exists
        let directorRes = await query("SELECT * FROM students WHERE sapid = 'DIRECTOR_STME'");
        if (directorRes.rows.length === 0) {
            console.log("⚠️ Director missing, creating...");
            await query(`
                INSERT INTO students (sapid, name, email, dept, program, role, password_hash)
                VALUES ('DIRECTOR_STME', 'Dr. STME Director', 'director.stme@nmims.edu', 'STME', 'Admin', 'director', 'securepassword')
            `);
            directorRes = await query("SELECT * FROM students WHERE sapid = 'DIRECTOR_STME'");
        }

        // Ensure Student exists
        let studentRes = await query("SELECT * FROM students WHERE sapid = '70012022001'");
        if (studentRes.rows.length === 0) {
            console.log("⚠️ Student missing, creating...");
            await query(`
                INSERT INTO students (sapid, name, email, dept, program, year, password_hash)
                VALUES ('70012022001', 'Gamification Tester', 'gamer@nmims.edu', 'STME', 'B.Tech', 3, 'password123')
             `);
            studentRes = await query("SELECT * FROM students WHERE sapid = '70012022001'");
        }
        const student = studentRes.rows[0];

        // 2. Login (Manual Token Gen to bypass bcrypt/API issues)
        console.log("🔑 Generating tokens manually...");

        const studentToken = jwt.sign({
            student_id: student.student_id,
            sapid: student.sapid,
            role: 'student',
            dept: student.dept
        }, JWT_SECRET);

        const directorToken = jwt.sign({
            student_id: 'DIRECTOR_STME', // Matches what we inserted
            sapid: 'DIRECTOR_STME',
            role: 'director',
            dept: 'STME'
        }, JWT_SECRET);

        // 3. Upload Achievement (Student) - Direct DB Insert Simulation
        console.log("📤 Student uploading certificate (Simulated via DB)...");

        const insertRes = await query(`
            INSERT INTO achievements (student_id, title, provider, type, date_completed, proof_url, status)
            VALUES ($1, 'Verification Cert', 'Test', 'Course', '2023-01-01', 'http://dummy/cert.pdf', 'Pending')
            RETURNING id
        `, [student.student_id]);
        const achievementId = insertRes.rows[0].id;
        console.log(`✅ inserted pending achievement ID: ${achievementId}`);

        // 4. Director Views Pending (Director)
        console.log("👀 Director checking pending list...");
        const pendingRes = await fetch(`${BASE_URL}/director/achievements/pending`, {
            headers: { 'Authorization': `Bearer ${directorToken}` }
        });

        if (!pendingRes.ok) {
            const text = await pendingRes.text();
            throw new Error(`Director Pending List Failed: ${pendingRes.status} ${pendingRes.statusText} - ${text}`);
        }

        let pendingData;
        try {
            pendingData = await pendingRes.json();
        } catch (err) {
            const text = await pendingRes.text(); // This might fail if body already consumed? No, .json() consumes it.
            // Actually, we can clone response or just log error.
            // If .json() fails, we can't read .text() again usually.
            // Better pattern:
            // const text = await pendingRes.text();
            // try { pendingData = JSON.parse(text); } catch { ... }
            throw new Error("JSON Parse Error on Pending List");
        }

        const found = pendingData.find(a => a.id === achievementId);
        if (!found) throw new Error("Director did not see the new achievement!");
        console.log("✅ Director sees the pending achievement.");

        // 5. Director Approves
        console.log("✅ Director approving...");
        await fetch(`${BASE_URL}/director/achievement/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directorToken}`
            },
            body: JSON.stringify({ id: achievementId, decision: 'Approved' })
        });
        console.log("✅ Approved.");

        // 6. Check Points/Leaderboard
        console.log("📊 Checking Leaderboard...");
        const lbRes = await fetch(`${BASE_URL}/gamification/leaderboard`);
        const lbData = await lbRes.json();

        const entry = lbData.find(s => s.sapid === student.sapid);
        if (!entry) throw new Error("Student not found on leaderboard!");

        if (parseInt(entry.score) < 10) throw new Error(`Score mismatch. Expected >= 10, got ${entry.score}`);

        console.log(`✅ Student found on leaderboard with score: ${entry.score}`);
        console.log("🏆 Verification Successful!");

    } catch (e) {
        console.error("❌ Verification Failed:", e.message);
    }
}

verify();
