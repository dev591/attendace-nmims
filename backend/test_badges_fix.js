
import { getAllBadgesWithStatus } from './lib/badges.js';
import { query } from './db.js';

async function testBadges() {
    console.log("🏅 Testing Badges Logic...");

    // Pick a valid student (use query instead of hardcode if possible, or use S90030770)
    const { rows } = await query('SELECT sapid FROM students LIMIT 1');
    if (rows.length === 0) {
        console.log("❌ No students found to test.");
        process.exit(1);
    }
    const sapid = rows[0].sapid;
    console.log(`Testing with student: ${sapid}`);

    try {
        const badges = await getAllBadgesWithStatus(sapid);
        console.log(`\n✅ Badges retrieved: ${badges.length}`);
        if (badges.length > 0) {
            console.log("   First badge:", badges[0]);
            if (badges[0].name && badges[0].description) {
                console.log("   ✅ Structure looks correct.");
            } else {
                console.log("   ❌ Structure malformed (missing name/description).");
            }
        }
    } catch (e) {
        console.error("❌ CRASHED:", e);
    }
    process.exit();
}

testBadges();
