
import { query } from './db.js';

async function inspectSchema() {
    console.log("🔍 Inspecting 'badges' table columns...");
    try {
        const res = await query('SELECT * FROM badges LIMIT 1');
        if (res.rows.length === 0) {
            console.log("⚠️ Table 'badges' is empty. Cannot infer columns easily via SELECT *.");
        } else {
            console.log("✅ Columns found in 'badges':");
            console.log(Object.keys(res.rows[0]));
        }

        console.log("\n🔍 Inspecting 'student_badges' table columns...");
        try {
            const res2 = await query('SELECT * FROM student_badges LIMIT 1');
            if (res2.rows.length === 0) {
                // Try inserting dummy to check columns? No, safer to fail.
                console.log("⚠️ Table 'student_badges' is empty.");
            } else {
                console.log("✅ Columns found in 'student_badges':");
                console.log(Object.keys(res2.rows[0]));
            }
        } catch (e) {
            console.log("❌ Table 'student_badges' fetch failed:", e.message);
            // Try 'awarded_badges'
            console.log("\n🔍 Inspecting 'awarded_badges' (fallback)...");
            try {
                const res3 = await query('SELECT * FROM awarded_badges LIMIT 1');
                console.log("✅ Columns found in 'awarded_badges':");
                console.log(Object.keys(res3.rows[0]));
            } catch (e2) {
                console.log("❌ Table 'awarded_badges' fetch failed:", e2.message);
            }
        }

    } catch (e) {
        console.error("❌ CRITICAL: Could not read 'badges' table:", e.message);
    }
    process.exit();
}

inspectSchema();
