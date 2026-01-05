import 'dotenv/config';
import { query } from './db.js';

async function diagnose() {
    console.log("🔍 Diagnosing Subject Resolution Mismatches...");

    // 1. Get Distinct Student Programs
    const studentProgs = await query(`
        SELECT DISTINCT program, count(*) as count 
        FROM students 
        GROUP BY program 
        ORDER BY count DESC
    `);

    console.log("\n--------- STUDENTS PROGRAMS ---------");
    console.table(studentProgs.rows);

    // 2. Get Distinct Curriculum Programs
    const currProgs = await query(`
        SELECT DISTINCT program, year, count(*) as subjects
        FROM curriculum 
        GROUP BY program, year 
        ORDER BY program, year
    `);

    console.log("\n--------- CURRICULUM DEFINITIONS ---------");
    console.table(currProgs.rows);

    // 3. Find Students with 0 Enrollments
    const zeroEnrollment = await query(`
        SELECT s.sapid, s.name, s.program, s.year, s.semester,
               (SELECT count(*) FROM enrollments e WHERE e.student_id = s.student_id) as enrollment_count
        FROM students s
        WHERE (SELECT count(*) FROM enrollments e WHERE e.student_id = s.student_id) = 0
        LIMIT 10
    `);

    console.log("\n--------- STUDENTS WITH 0 SUBJECTS (Sample) ---------");
    if (zeroEnrollment.rows.length === 0) {
        console.log("✅ All students have at least one enrollment!");
    } else {
        console.table(zeroEnrollment.rows);

        // Detailed check for the first failed student
        const sample = zeroEnrollment.rows[0];
        console.log(`\n🔍 Detailed Check for SAPID: ${sample.sapid}`);
        console.log(`   Student: Program='${sample.program}', Year=${sample.year}, Sem=${sample.semester}`);

        // Check for exact match in curriculum
        const exactMatch = await query(`
            SELECT * FROM curriculum 
            WHERE LOWER(program) = LOWER($1) 
              AND year = $2 
              AND semester = $3
        `, [sample.program, sample.year, sample.semester]);

        if (exactMatch.rows.length > 0) {
            console.log(`   ✅ FOUND ${exactMatch.rows.length} matching subjects in curriculum (Exact Match).`);
            console.log("   ❓ Why are they not enrolled? Check Auto-Enrollment trigger.");
        } else {
            console.log(`   ❌ NO matching subjects found in curriculum.`);
            console.log(`   Scanning for potential 'Program' name mismatches...`);

            // Fuzzy search for program
            const fuzzy = await query(`
                SELECT DISTINCT program FROM curriculum 
                WHERE LOWER(program) LIKE $1 OR LOWER(program) LIKE $2
            `, [`%${sample.program.split(' ')[0]}%`, `%${sample.program.substr(0, 4)}%`]);

            console.log("   Potential Curriculum Matches:", fuzzy.rows.map(r => r.program));
        }
    }

    process.exit();
}

diagnose();
