
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';
const SAPID = 'S90012023'; // Using the debug user from prior steps
const PASS = 'welcome123'; // Assuming default or I need to check setup

async function verify() {
    console.log("--- STARTING VERIFICATION ---")

    // 0. Set Password (to ensure we can login)
    console.log("0. Setting Password...");
    await fetch(`${BASE_URL}/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sapid: SAPID, password: PASS })
    });

    // 1. Login
    console.log("1. Logging in...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sapid: SAPID, password: PASS })
    });

    if (!loginRes.ok) {
        console.error("Login Failed", await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    const studentId = loginData.student_id;
    console.log("Login Success. Token acquired.");

    // 2. Dashboard
    console.log("\n2. Fetching Dashboard (Refactored Analytics + Timetable)...");
    const dashRes = await fetch(`${BASE_URL}/student/${studentId}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!dashRes.ok) {
        console.error("Dashboard Failed", await dashRes.text());
        return;
    }

    const dashData = await dashRes.json();
    console.log("Full Dashboard Response:", JSON.stringify(dashData, null, 2));

    console.log("Dashboard Status:", dashData.analytics ? "OK" : "MISSING ANALYTICS");
    console.log("Timetable Entries:", dashData.timetable?.length);
    console.log("Badge Count:", dashData.currentUser?.badges?.length);

    if (dashData.timetable) {
        console.log("Sample Timetable:", dashData.timetable[0]);
    }

    // 3. Overview
    console.log("\n3. Fetching Overview (Refactored Subject Service)...");
    const overviewRes = await fetch(`${BASE_URL}/student/${studentId}/attendance-overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const overviewData = await overviewRes.json();
    console.log("Overview Stats Count:", overviewData.stats?.length);

    // 4. Badges (Explicit)
    // console.log("\n4. Explicit Badge Check...");
    // ...

    console.log("\n--- VERIFICATION COMPLETE ---");
}

verify();
