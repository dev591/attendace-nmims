
import 'dotenv/config';
import { query } from './db.js';

async function migrate() {
    console.log("🚀 STARTING STRICT DATA NORMALIZATION...");

    // 1. Normalize Program (B.Tech -> Engineering)
    const pRes = await query(`
        UPDATE students 
        SET program = 'Engineering' 
        WHERE LOWER(program) IN ('b tech', 'b.tech', 'btech', 'engineering')
    `);
    console.log(`✅ Normalized ${pRes.rowCount} programs to 'Engineering'.`);

    // 2. Normalize Branch (Data Science -> DS)
    // Assuming 'dept' column holds the branch info based on previous schema check
    const dsRes = await query(`
        UPDATE students 
        SET dept = 'DS' 
        WHERE LOWER(dept) IN ('data science', 'datascience', 'ds', 'b.tech cs-ds', 'cs-ds')
    `);
    console.log(`✅ Normalized ${dsRes.rowCount} branches to 'DS'.`);

    const ceRes = await query(`
        UPDATE students 
        SET dept = 'CE' 
        WHERE LOWER(dept) IN ('computer engineering', 'computer eng', 'ce', 'comp eng')
    `);
    console.log(`✅ Normalized ${ceRes.rowCount} branches to 'CE'.`);

    console.log("✨ Migration Complete. Please RE-UPLOAD Curriculum with 'Branch' column to enforce strict matching.");
    process.exit();
}

migrate();
