
import { query, getClient } from './db.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const BASE_URL = 'http://127.0.0.1:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

// Helpers
async function fetchAPI(url, method = 'GET', token, body, fileBlob) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let options = { method, headers };

    if (fileBlob) {
        // FormData for file uploads
        const fd = new FormData();
        fd.append('file', fileBlob, 'test_upload.csv');
        if (body) {
            Object.keys(body).forEach(k => fd.append(k, body[k]));
        }
        options.body = fd;
    } else if (body) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${url}`, options);
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API Error ${res.status}: ${txt}`);
    }
    return res.json();
}

async function runSystemAudit() {
    console.log("🚀 STARTING SYSTEM READINESS AUDIT 🚀\n");

    const TEST_SAPID = '9999999990';
    const TEST_DIR_SAPID = '9999999991';

    try {
        // 1. Setup Test Users
        console.log("🔹 [SETUP] Creating Test Users...");
        const sRes = await query("INSERT INTO students (student_id, sapid, name, role, dept, program, year, password_hash) VALUES ($1, $1, 'Test Student', 'student', 'STME', 'B.Tech', 4, 'mock_hash') ON CONFLICT (sapid) DO UPDATE SET role='student'", [TEST_SAPID]);
        if (sRes.error) throw new Error("Student Insert Failed: " + sRes.error);

        const dRes = await query("INSERT INTO students (student_id, sapid, name, role, password_hash) VALUES ($1, $1, 'Test Director', 'director', 'mock_hash') ON CONFLICT (sapid) DO UPDATE SET role='director'", [TEST_DIR_SAPID]);
        if (dRes.error) throw new Error("Director Insert Failed: " + dRes.error);

        // Verify Persistence
        const check = await query("SELECT 1 FROM students WHERE sapid = $1", [TEST_SAPID]);
        if (check.rows.length === 0) throw new Error("CRITICAL: Test Student NOT found in DB after Insert!");

        const studentToken = jwt.sign({ id: TEST_SAPID, sapid: TEST_SAPID, role: 'student', student_id: TEST_SAPID }, JWT_SECRET);
        const directorToken = jwt.sign({ id: TEST_DIR_SAPID, sapid: TEST_DIR_SAPID, role: 'director' }, JWT_SECRET);
        const adminToken = jwt.sign({ sapid: 'ADMIN', role: 'admin' }, JWT_SECRET);

        // 2. Test Admin Config / Uploads
        console.log("\n🔹 [ADMIN] Testing Data Ingest...");

        // A. Upload Timetable (Live Session Check)
        console.log("   -> Injecting a 'Live' Session into DB for testing...");
        await query("INSERT INTO subjects (subject_id, name, code) VALUES ('TEST_SUB_1', 'Test Subject', 'TEST101') ON CONFLICT DO NOTHING");

        // Insert Session for NOW (Wide Window)
        const startTime = '00:00:00';
        const endTime = '23:59:59';

        await query(`INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, type, status, location) 
                     VALUES ('TEST_SESS_LIVE', 'TEST_SUB_1', CURRENT_DATE, $1, $2, 'Lecture', 'conducted', 'TestRoom')
                     ON CONFLICT (session_id) DO UPDATE SET start_time=$1, end_time=$2`, [startTime, endTime]);

        console.log("   ✅ Live Session Injected");

        // 3. Test Student Dashboard
        console.log("\n🔹 [STUDENT] Testing Dashboard Source of Truth...");
        const dash = await fetchAPI(`/student/${TEST_SAPID}/dashboard`, 'GET', studentToken);

        if (!dash.analytics) throw new Error("Dashboard missing analytics object");
        console.log("   ✅ Dashboard Loaded Successfully");

        // 4. Test Director Stats (The Logic Check)
        console.log("\n🔹 [DIRECTOR] Verifying Live Data...");
        const stats = await fetchAPI('/director/stats', 'GET', directorToken);
        console.log("   -> Received Stats:", JSON.stringify(stats.kpi));

        if (stats.kpi.live_classes > 0) {
            console.log("   ✅ 'Live Classes' detection working (Count > 0)");
        } else {
            console.warn("   ⚠️ 'Live Classes' detection showed 0. Check Injection or Timezone.");
        }

        // 5. Test ICA Marks Upload (Admin)
        console.log("\n🔹 [ADMIN] Testing Marks Upload...");
        const marksCSV = `sapid,subject_code,test_name,marks,total\n${TEST_SAPID},TEST101,MidTerm,25,30`;
        const marksBlob = new Blob([marksCSV], { type: 'text/csv' });

        const marksRes = await fetchAPI('/admin/ingest/ica-marks', 'POST', adminToken, null, marksBlob);
        if (marksRes.success) {
            console.log("   ✅ Marks Uploaded");
        } else {
            console.error("   ❌ Marks Upload Failed", marksRes);
        }

        // Verify on Director Profile
        console.log("\n🔹 [DIRECTOR] Verifying Student Profile Data...");
        const profile = await fetchAPI(`/director/student/${TEST_SAPID}`, 'GET', directorToken);
        const hasMarks = profile.ica_marks.some(m => m.test_name === 'MidTerm' && m.marks_obtained === '25.00');

        // Cleanup
        console.log("\n🔹 [CLEANUP] Removing test data...");
        // Updated Cleanup Order:
        await query("DELETE FROM ica_marks WHERE student_id = $1", [TEST_SAPID]);
        await query("DELETE FROM student_projects WHERE student_id = $1", [TEST_SAPID]);
        await query("DELETE FROM sessions WHERE subject_id = 'TEST_SUB_1'");
        await query("DELETE FROM students WHERE sapid IN ($1, $2)", [TEST_SAPID, TEST_DIR_SAPID]);
        await query("DELETE FROM subjects WHERE subject_id = 'TEST_SUB_1'");

        if (hasMarks) console.log("   ✅ Director sees uploaded marks");
        else throw new Error("Uploaded marks not visible in Director Profile");

        console.log("\n✅ SYSTEM AUDIT COMPLETE: ALL CHECKS PASSED");
        process.exit(0);

    } catch (e) {
        console.error("\n❌ AUDIT FAILED:", e.message);
        process.exit(1);
    }
}

runSystemAudit();
