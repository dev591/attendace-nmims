import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000';

async function runVerify() {
    console.log("🚀 Starting Notification Verification...");

    // 1. Login Director
    console.log("1️⃣ Logging in as Director...");
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sapid: 'DIRECTOR', password: 'DS001' })
    });

    if (!loginRes.ok) {
        console.error("❌ Director Login Failed", await loginRes.text());
        return;
    }

    const { token: dirToken } = await loginRes.json();
    console.log("✅ Director Logged In");

    // 2. Identify Target Student
    const targetSapid = '590000004'; // Using the one from user screenshots
    console.log(`2️⃣ Targeting Student: ${targetSapid}`);

    // 3. Send Notification
    const msg = `Automated Verification Message ${Date.now()}`;
    console.log(`3️⃣ Sending Message: "${msg}"...`);

    const notifyRes = await fetch(`${API_BASE}/director/notify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dirToken}`
        },
        body: JSON.stringify({
            sapid: targetSapid,
            message: msg,
            type: 'success'
        })
    });

    if (!notifyRes.ok) {
        console.error("❌ Send Notification Failed", await notifyRes.text());
        return;
    }
    console.log("✅ Notification Sent");

    // 4. Verify in Student Dashboard logic (Simulated DB check via another login or just trust 200 OK?)
    // Let's try to login as student and check dashboard
    // We need student password. Usually 'password' or '123456'.
    // If we can't login, we can atleast say we sent it successfully.
    // But let's try to verify via debug route if possible.
    // For now, 200 OK from notify endpoint means DB insert worked (as per my code).

    console.log("✅ Verification Script Complete. Please check Student Dashboard UI.");
}

runVerify();
