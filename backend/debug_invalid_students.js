
import { query } from './db.js';
import { normalizeBranch } from './lib/program_branch_mapper.js';

async function scanForInvalidStudents() {
    console.log("🕵️‍♀️ SCANNING FOR STUDENTS BLOCKED BY STRICT BRANCH POLICY...");

    // Fetch all students with Year/Sem (implies they are "active" academic students)
    const res = await query(`
        SELECT student_id, sapid, name, program, dept, year, semester 
        FROM students 
        WHERE year IS NOT NULL
    `);

    let blockedCount = 0;
    let validCount = 0;

    console.log(`\nAnalyzing ${res.rows.length} students...`);

    for (const s of res.rows) {
        const normBranch = normalizeBranch(s.dept);

        if (!normBranch) {
            console.log(`❌ BLOCKED: ${s.sapid} (${s.name})`);
            console.log(`   Program: '${s.program}', Dept: '${s.dept}'`);
            console.log(`   Reason: Dept normalizes to NULL. Strict Mode rejects this.`);
            blockedCount++;
        } else {
            validCount++;
        }
    }

    console.log(`\n-----------------------------------`);
    console.log(`✅ Valid Students:   ${validCount}`);
    console.log(`❌ BLOCKEd Students: ${blockedCount}`);

    if (blockedCount > 0) {
        console.log(`\n⚠️ CONCLUSION: The user might be logged in as one of these ${blockedCount} blocked students.`);
        console.log("   They have 0 subjects because their 'Dept' is invalid/missing in the DB.");
    } else {
        console.log(`\n✅ CONCLUSION: Data looks valid. Issue might be API/Frontend or Auto-Enrollment not triggering.`);
    }

    process.exit();
}

scanForInvalidStudents();
