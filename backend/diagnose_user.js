
import { query } from './db.js';

async function diagnoseUser() {
    const sapid = '90030770'; // From screenshot ID S90030770
    const studentId = 'S' + sapid;
    console.log(`🔍 DIAGNOSING STUDENT: ${studentId}`);

    // 1. Fetch Student Details
    const sRes = await query("SELECT * FROM students WHERE student_id = $1", [studentId]);
    if (sRes.rows.length === 0) {
        console.log("❌ Student NOT FOUND in DB.");
        process.exit();
    }
    const s = sRes.rows[0];
    console.log("\n👤 STUDENT RECORD:");
    console.table([s]);

    // 2. Check Enrollments
    const eRes = await query("SELECT * FROM enrollments WHERE student_id = $1", [studentId]);
    console.log(`\n📚 CURRENT ENROLLMENTS: ${eRes.rowCount}`);
    if (eRes.rowCount > 0) console.table(eRes.rows);

    // 3. Simulate Curriculum Match
    const program = s.program; // e.g. "engineering"
    const dept = s.dept;       // e.g. "DS"?

    let lookupProg = program.toLowerCase();
    if (lookupProg === 'engineering' && dept) {
        lookupProg = `${lookupProg}-${dept.toLowerCase()}`;
    }

    console.log(`\n🔑 MATCHING KEYS: Program='${lookupProg}', Year=${s.year}, Sem=${s.semester}`);

    const cRes = await query(`
        SELECT count(*) 
        FROM curriculum 
        WHERE LOWER(program) = $1 AND year = $2 AND semester = $3
    `, [lookupProg, s.year, s.semester]);

    console.log(`\n🎯 EXPECTED MATCHES: ${cRes.rows[0].count}`);

    if (parseInt(eRes.rowCount) === 0 && parseInt(cRes.rows[0].count) > 0) {
        console.log("⚠️  CONCLUSION: Student SHOULD be enrolled but isn't. Login didn't trigger auto-enroll?");

        // AUTO HEAL
        // import { autoEnrollStudent } from './lib/enrollment_service.js'; // Can't import easily in standalone unless module
        // We will just suggest the user logs out/in or manual fix.
    }

    process.exit();
}

diagnoseUser();
