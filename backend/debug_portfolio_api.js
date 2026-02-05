
import { getClient } from './db.js';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:4000';
const SAPID = '50012999999'; // The test user we seeded in verify_career_flow
const SECRET = process.env.JWT_SECRET || 'antigravity_secret_key_8823';

async function verifyPortfolio() {
    try {
        console.log("🚀 Verifying Portfolio API...");

        // 1. Generate Token
        // Note: verify_career_flow seeded 'test_id' / SAPID 50012999999
        const token = jwt.sign({ sapid: SAPID, id: 'test_id', role: 'student' }, SECRET);

        // 2. Fetch Portfolio
        console.log(`fetching ${API_URL}/student/${SAPID}/portfolio...`);
        const res = await fetch(`${API_URL}/student/${SAPID}/portfolio`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            console.log("✅ API Response Status: 200 OK");
            console.log("Structure Check:");
            console.log("- student:", !!data.student);
            console.log("- skills:", Array.isArray(data.skills));
            console.log("- achievements:", Array.isArray(data.achievements));
            console.log("- badges:", Array.isArray(data.badges));
            console.log("- verifiedScore:", typeof data.verifiedScore);

            if (data.student) {
                console.log("Student Data:", {
                    name: data.student.name,
                    dream: data.student.dream_company,
                    onboarded: data.student.is_onboarded
                });
            }
        } else {
            console.error("❌ API Failed:", res.status, await res.text());
        }

    } catch (err) {
        console.error("❌ Request Failed:", err.message);
    } finally {
        process.exit();
    }
}

verifyPortfolio();
