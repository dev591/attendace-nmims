
import { query } from './db.js';
import { getSubjectsForStudent } from './lib/subject_service.js';

async function verifyStudent(inputSadid) {
    console.log(`🔎 VERIFYING STUDENT: ${inputSadid}`);

    // 1. DB LOOKUP (Try both formats)
    const variants = [inputSadid, `S${inputSadid}`, inputSadid.replace(/^S/, '')];
    let student = null;

    for (const v of variants) {
        const res = await query('SELECT * FROM students WHERE sapid = $1', [v]);
        if (res.rows.length > 0) {
            student = res.rows[0];
            break;
        }
    }

    if (!student) {
        console.log(`❌ Student NOT FOUND in Database.`);
        console.log(`   Tried: ${variants.join(', ')}`);
        process.exit(1);
    }

    console.log(`✅ FOUND: ${student.name} (${student.sapid})`);
    console.log(`   Program: '${student.program}'`);
    console.log(`   Dept:    '${student.dept}'`);
    console.log(`   Year: ${student.year}, Sem: ${student.semester}`);

    // 2. CHECK ENROLLMENTS TABLE
    const enrollRes = await query(
        `SELECT s.code, s.name 
         FROM enrollments e 
         JOIN subjects s ON e.subject_id = s.subject_id 
         WHERE e.student_id = $1`,
        [student.student_id]
    );

    console.log(`\n📋 DB Enrollments (${enrollRes.rows.length}):`);
    if (enrollRes.rows.length === 0) {
        console.log("   ❌ ZERO ENROLLMENTS IN DB.");
    } else {
        enrollRes.rows.forEach(r => console.log(`   - [${r.code}] ${r.name}`));
    }

    // 3. SERVICE RESOLUTION (Logic Check)
    try {
        const serviceRes = await getSubjectsForStudent(student.sapid);
        console.log(`\n🛠 Service Resolution (${serviceRes.subjects.length}):`);
        if (serviceRes.subjects.length > 0) {
            console.log("   ✅ Service logic returns subjects correctly.");
        } else {
            console.log("   ❌ Service logic returns 0 subjects (Mismatch with DB?)");
        }
    } catch (e) {
        console.log(`   ❌ Service CRASH: ${e.message}`);
    }

    process.exit();
}

verifyStudent('90030002');
