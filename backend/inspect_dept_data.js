
import { query } from './db.js';

async function inspectDept() {
    console.log("🔍 INSPECTING STUDENT DEPARTMENT DATA...");

    const total = await query("SELECT count(*) FROM students");
    const withDept = await query("SELECT count(*) FROM students WHERE dept IS NOT NULL");
    const nullDept = await query("SELECT count(*) FROM students WHERE dept IS NULL");

    console.log(`\n📊 STATS:`);
    console.log(`   Total Students: ${total.rows[0].count}`);
    console.log(`   With Dept:      ${withDept.rows[0].count}`);
    console.log(`   Without Dept:   ${nullDept.rows[0].count}`);

    if (parseInt(withDept.rows[0].count) > 0) {
        const sample = await query("SELECT student_id, program, dept, year, semester FROM students WHERE dept IS NOT NULL LIMIT 5");
        console.log("\n✅ SAMPLE VALID STUDENTS:");
        console.table(sample.rows);
    }

    if (parseInt(nullDept.rows[0].count) > 0) {
        const sample = await query("SELECT student_id, program, dept, year, semester FROM students WHERE dept IS NULL LIMIT 5");
        console.log("\n❌ SAMPLE INVALID STUDENTS (No Dept):");
        console.table(sample.rows);
    }

    // Check Curriculum Programs to see what we are trying to match against
    const curr = await query("SELECT DISTINCT program FROM curriculum");
    console.log("\n📚 AVAILABLE CURRICULUM PROGRAMS:");
    console.table(curr.rows);

    process.exit();
}

inspectDept();
