
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000';

async function verifyFlow() {
    console.log("🚀 Starting E2E API Verification...");

    try {
        // 1. Login
        console.log("1. Attempting Login...");
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sapid: '90020004', // Mapped to S90020054 in cleanup
                password: 'password123'
            })
        });

        if (!loginRes.ok) throw new Error(`Login Failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        console.log("DEBUG: Login Response:", JSON.stringify(loginData));

        // Response is flat
        console.log("✅ Login Success for:", loginData.name);
        const token = loginData.token;
        const studentId = loginData.student_id;

        // 2. Fetch Dashboard
        console.log(`2. Fetching Dashboard for ${studentId}...`);
        const dashRes = await fetch(`${API_BASE}/student/${studentId}/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!dashRes.ok) {
            console.error(`❌ Dashboard Failed: ${dashRes.status}`);
            const text = await dashRes.text();
            console.error("   Response:", text);
            return;
        }

        const dashData = await dashRes.json();
        console.log("✅ Dashboard Fetched!");
        console.log("   Server Meta:", dashData.debug_meta || "MISSING (Server Stale)");
        console.log("   Badges Count (Root):", dashData.currentUser?.badges?.length);
        console.log("   Badges Count (Nested):", dashData.badges?.length); // Check both places
        console.log("   Subjects Count:", dashData.subjects?.length);
        console.log("   Analytics:", Object.keys(dashData.currentUser?.analytics || {}));

    } catch (e) {
        console.error("🚨 CRITICAL FAILURE:", e.message);
    }
}
verifyFlow();
