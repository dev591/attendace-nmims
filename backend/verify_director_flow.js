
import { query, getClient } from './db.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const BASE_URL = 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

async function runVerification() {
    console.log("🚀 Starting Director Flow Verification...");

    // 1. Setup Data
    console.log("1. Setting up Test Users...");
    await query("INSERT INTO students (student_id, sapid, name, password_hash, role) VALUES ('DIR001', '7000000000', 'Director Strange', '$2a$10$abcdefg', 'director') ON CONFLICT (sapid) DO UPDATE SET role = 'director'");
    await query("INSERT INTO students (student_id, sapid, name, password_hash, role, dept, year) VALUES ('STU001', '7001112222', 'Peter Parker', '$2a$10$abcdefg', 'student', 'STME', 3) ON CONFLICT (sapid) DO NOTHING");

    const directorToken = jwt.sign({ id: 'DIR001', sapid: '7000000000', role: 'director' }, JWT_SECRET);
    const studentToken = jwt.sign({ id: 'STU001', sapid: '7001112222', role: 'student', student_id: 'STU001' }, JWT_SECRET);
    const adminToken = jwt.sign({ sapid: 'ADMIN', role: 'admin' }, JWT_SECRET);

    console.log("✅ Users Setup & Tokens Generated");

    // 2. Student Uploads Project
    console.log("\n2. [Student] Uploading Project...");
    const projRes = await fetch(`${BASE_URL}/student/project`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${studentToken}`
        },
        body: JSON.stringify({
            title: "Web Slinger Prototoype",
            description: "A system to catch bugs using web technology.",
            link: "https://github.com/spidey/web"
        })
    });
    const projJson = await projRes.json();
    console.log("Project Upload:", projJson);
    if (!projJson.success && !projJson.message?.includes('successfully')) throw new Error("Project upload failed " + JSON.stringify(projJson));

    // 3. Admin Uploads Marks
    console.log("\n3. [Admin] Uploading ICA Marks...");
    const csvContent = "sapid,subject_code,test_name,marks,total\n7001112222,CS101,Test 1,18,20\n7001112222,CS101,Test 2,19,20";

    const form = new FormData();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    form.append('file', blob, 'marks.csv');

    const marksRes = await fetch(`${BASE_URL}/admin/ingest/ica-marks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${adminToken}`
        },
        body: form
    });

    const marksJson = await marksRes.json();
    console.log("Marks Upload:", marksJson);

    // 4. Director Views Profile
    console.log("\n4. [Director] Viewing Student Profile...");
    const profileRes = await fetch(`${BASE_URL}/director/student/7001112222`, {
        headers: { 'Authorization': `Bearer ${directorToken}` }
    });
    const profileJson = await profileRes.json();

    if (profileJson.error) throw new Error(profileJson.error);

    console.log("\n--- Director View Data ---");
    console.log("Name:", profileJson.profile.name);

    const hasMarks = profileJson.ica_marks && profileJson.ica_marks.length > 0;
    console.log("Marks:", hasMarks ? "✅ Found" : "❌ Missing");
    if (hasMarks) console.table(profileJson.ica_marks);

    const hasProjects = profileJson.projects && profileJson.projects.length > 0;
    console.log("Projects:", hasProjects ? "✅ Found" : "❌ Missing");
    if (hasProjects) console.table(profileJson.projects);

    if (hasMarks && hasProjects) {
        console.log("\n✅ VERIFICATION SUCCESS: All features working!");
        process.exit(0);
    } else {
        console.log("\n⚠️ VERIFICATION PARTIAL: Some data missing.");
        process.exit(1);
    }
}

runVerification().catch(e => {
    console.error("❌ Verification Failed:", e);
    process.exit(1);
});
