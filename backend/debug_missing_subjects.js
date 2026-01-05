
import 'dotenv/config';
import { query } from './db.js';

async function check() {
    console.log("🔍 Checking for Curriculum entries with missing Subjects...");

    const missing = await query(`
        SELECT c.program, c.year, c.semester, c.subject_code, c.subject_name
        FROM curriculum c
        LEFT JOIN subjects s ON c.subject_code = s.code
        WHERE s.subject_id IS NULL
    `);

    if (missing.rows.length === 0) {
        console.log("✅ All Curriculum entries mapped to valid Subjects.");
    } else {
        console.log(`❌ Found ${missing.rows.length} Curriculum entries with NO Matching Subject Definition!`);
        console.table(missing.rows);
    }
    process.exit();
}
check();
