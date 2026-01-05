
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000';
const STUDENT_ID = 'S90030002'; // Normalized ID

async function checkLive() {
    console.log(`📡 TESTING LIVE SERVER API for ${STUDENT_ID}...`);
    try {
        const res = await fetch(`${API_BASE}/student/${STUDENT_ID}/snapshot`);
        console.log(`STATUS: ${res.status}`);

        if (res.ok) {
            const data = await res.json();
            console.log("\n📦 LIVE SERVER RESPONSE:");
            console.log(`   Student: ${data.student.name} (${data.student.program})`);
            console.log(`   Subjects Count: ${data.subjects ? data.subjects.length : 0}`);

            if (data.subjects && data.subjects.length > 0) {
                console.log("✅ LIVE SERVER IS WORKING! Subjects are being returned.");
                data.subjects.forEach(s => console.log(`   - [${s.code}] ${s.name}`));
            } else {
                console.log("❌ LIVE SERVER RETURNED 0 SUBJECTS (Despite DB passing audit?)");
            }
        } else {
            console.log("❌ API ERROR:", await res.text());
        }
    } catch (e) {
        console.log("❌ CONNECTION ERROR:", e.message);
    }
}

checkLive();
