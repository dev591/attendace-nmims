import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

const createToken = (id, sapid) => {
    return jwt.sign({ student_id: id, role: 'student', sapid, name: 'AnalyticsTester' }, JWT_SECRET);
};

async function verifyPrediction() {
    console.log("🚀 PREDICTIVE INTELLIGENCE CHECK 🚀");
    try {
        const token = createToken('5', '500000001'); // Pooja Nair

        console.log("\n🕵️‍♀️ Fetching Deep Analytics...");
        const res = await axios.get(`${BASE_URL}/student/500000001/analytics/deep`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const predictions = res.data.predictions;
        if (predictions && predictions.length > 0) {
            console.log("   ✅ Predictions Received");
            predictions.forEach(p => {
                console.log(`   📘 ${p.code}: ${p.status}`);
                if (p.status === 'SAFE') console.log(`      Safe Bunks: ${p.safe_bunks}, Until: ${p.safe_until || 'N/A'}`);
                if (p.status === 'DANGER') console.log(`      Recovery Needed: ${p.recovery_needed}`);
            });
        } else {
            console.error("   ❌ No predictions found in response");
        }

    } catch (e) {
        console.error("❌ Analytics Verification Failed:", e.message);
        if (e.response) console.error(e.response.data);
    }
}

verifyPrediction();
