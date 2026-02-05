
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

async function verify() {
    console.log("🚀 Verifying Leaderboard (Oracle Readiness)...");

    // 1. Create Token for a generic student
    const token = jwt.sign({
        id: 'S999999999', // Generic ID
        sapid: 'S999999999',
        role: 'student'
    }, JWT_SECRET);

    try {
        const res = await fetch(`${API_BASE}/student/leaderboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            console.log("✅ API Success. Data received:", data);
            if (Array.isArray(data)) {
                console.log(`✅ Data is valid Array (Length: ${data.length})`);
                if (data.length === 0) console.log("⚠️ Leaderboard is empty (Expected if fresh DB - Zero Mock Compliance)");
                else console.log("✅ Leaderboard has entries!");
            } else {
                console.error("❌ Data is NOT an array:", data);
                process.exit(1);
            }
        } else {
            console.error(`❌ API Failed: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error("Response:", text);
            process.exit(1);
        }
    } catch (e) {
        console.error("❌ Exception:", e);
        process.exit(1);
    }
}

verify();
