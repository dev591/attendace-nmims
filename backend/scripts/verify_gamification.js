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
    return jwt.sign({ student_id: id, role: 'student', sapid, name: 'Gamer' }, JWT_SECRET);
};

async function verifyGamification() {
    console.log("🚀 GAMIFICATION 2.0 CHECK 🚀");
    try {
        const token = createToken('5', '500000001');

        console.log("\n1️⃣ Verifying Leaderboard (Overall)...");
        const res = await axios.get(`${BASE_URL}/student/leaderboard?category=overall&dept=All`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.length > 0) {
            const top = res.data[0];
            console.log("   ✅ Top Student:", top.name);
            console.log("      Total XP:", top.total_xp);
            console.log("      Acad XP:", top.academic_xp);
            console.log("      Skill XP:", top.skill_xp);
            console.log("      Streak:", top.streak);

            if (top.streak !== undefined && top.skill_xp !== undefined) {
                console.log("   ✅ Gamification data structure confirmed.");
            } else {
                console.error("   ❌ Missing new fields.");
            }
        } else {
            console.log("   ⚠️ No data in leaderboard (Expected if no attendance)");
        }

    } catch (e) {
        console.error("❌ Gamification Verification Failed:", e.message);
        if (e.response) console.error(e.response.data);
    }
}

verifyGamification();
