
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const BASE_URL = 'http://localhost:4000';
const SAPID = 'S90012023';
const PASSWORD = 'welcome123'; // Debug user password

async function verifyDashboard() {
    console.log("--- VERIFYING DASHBOARD API FIX ---");

    // 1. Login
    console.log("1. Logging in...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sapid: SAPID, password: PASSWORD })
    });

    if (!loginRes.ok) {
        throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
    }

    const { token, student_id } = await loginRes.json();
    console.log(`   Logged in as ${student_id}`);

    // 2. Fetch Dashboard
    console.log("2. Fetching Dashboard...");
    const dashRes = await fetch(`${BASE_URL}/student/${student_id}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   Status: ${dashRes.status}`);

    if (!dashRes.ok) {
        throw new Error(`Dashboard API failed: ${dashRes.status}`);
    }

    const data = await dashRes.json();
    console.log("   Dashboard Data Received:");
    console.log(`   - Upcoming Events: ${data.upcoming_events ? data.upcoming_events.length : 'MISSING'}`);
    console.log(`   - Timetable: ${data.timetable ? data.timetable.length : 'MISSING'}`);
    console.log(`   - Analytics: ${data.analytics ? 'PRESENT' : 'MISSING'}`);

    if (!data.upcoming_events) {
        throw new Error("FAILED: upcoming_events is missing (This was the crash location!)");
    }

    console.log("✅ DASHBOARD FIX VERIFIED - NO CRASH");
}

verifyDashboard().catch(e => {
    console.error("❌ VERIFICATION FAILED:", e);
    process.exit(1);
});
