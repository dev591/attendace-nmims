
import { query } from './db.js';

async function inspectCurriculum() {
    console.log("🔎 INSPECTING CURRICULUM FOR 'engineering-ds' (Year 1, Sem 1)...");

    // We know the key is 'engineering-ds' from previous debug
    const res = await query(`
        SELECT subject_code, subject_name, program, year, semester 
        FROM curriculum 
        WHERE program = 'engineering-ds' AND year = 1 AND semester = 1
        ORDER BY subject_code
    `);

    if (res.rows.length === 0) {
        console.log("❌ No subjects found.");
    } else {
        console.log(`✅ Found ${res.rows.length} subjects:`);
        console.table(res.rows);
    }

    process.exit();
}

inspectCurriculum();
