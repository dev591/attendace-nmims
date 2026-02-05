
import { query } from './db.js';

async function verifyCounts() {
    console.log("🔍 Verifying Director Dashboard Data Integrity...");

    try {
        // 1. Total Students
        const totalRes = await query("SELECT COUNT(*) FROM students WHERE role = 'student'");
        const total = parseInt(totalRes.rows[0].count);
        console.log(`✅ Total Students (DB Limit Check): ${total}`);

        // 2. Dept Distribution
        const distRes = await query(`
            SELECT dept, COUNT(*) as count
            FROM students
            WHERE role = 'student'
            GROUP BY dept
        `);
        console.log("\n📊 Department Distribution:");
        let distTotal = 0;
        distRes.rows.forEach(r => {
            console.log(`   - ${r.dept}: ${r.count}`);
            distTotal += parseInt(r.count);
        });

        if (distTotal !== total) {
            console.error(`❌ Data Mismatch! Distribution Sum (${distTotal}) != Total Count (${total})`);
        } else {
            console.log("✅ Distribution Sum matches Total Count.");
        }

        // 3. Sample Student Verification
        const sampleRes = await query("SELECT sapid, name, program, year FROM students ORDER BY RANDOM() LIMIT 5");
        console.log("\n👤 Random Sample Verification (Check these manually):");
        sampleRes.rows.forEach(s => {
            console.log(`   - [${s.sapid}] ${s.name} | ${s.program} | Year ${s.year}`);
        });

    } catch (e) {
        console.error("Verification Failed:", e);
    } finally {
        process.exit();
    }
}

verifyCounts();
