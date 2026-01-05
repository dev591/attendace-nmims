
import { query } from './db.js';

async function verifyJoin() {
    console.log("🔍 VERIFYING JOIN INTEGRITY...");

    // 1. Check a sample matched curriculum item
    const cRes = await query("SELECT subject_code FROM curriculum WHERE program='engineering-ds' AND year=3 AND semester=5 LIMIT 5");
    if (cRes.rows.length === 0) {
        console.log("❌ No curriculum found for engineering-ds Year 3 Sem 5");
        process.exit();
    }

    console.log("Checking compatibility for these codes:");
    console.table(cRes.rows);

    for (const row of cRes.rows) {
        const code = row.subject_code;
        // Check exact match
        const sRes = await query("SELECT * FROM subjects WHERE code = $1", [code]);
        if (sRes.rows.length > 0) {
            console.log(`✅ MATCH FOUND for '${code}'`);
        } else {
            console.log(`❌ NO MATCH for '${code}' in subjects table! (Possible whitespace/case issue)`);
            // Check fuzzy
            const fuzzy = await query("SELECT * FROM subjects WHERE TRIM(LOWER(code)) = TRIM(LOWER($1))", [code]);
            if (fuzzy.rows.length > 0) {
                console.log(`   ⚠️ But found fuzzy match: '${fuzzy.rows[0].code}'`);
            }
        }
    }

    // 2. Check Enrollments for a specific student
    const sRes = await query("SELECT * FROM enrollments WHERE student_id = 'S90030331'");
    console.log(`\nEnrollments for S90030331: ${sRes.rowCount}`);

    process.exit();
}

verifyJoin();
