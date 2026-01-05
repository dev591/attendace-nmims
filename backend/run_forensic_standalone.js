
import { getClient } from './db.js';
import { normalizeProgram } from './lib/program_mapper.js';
import { normalizeBranch } from './lib/program_branch_mapper.js';
import { getSubjectsForStudent } from './lib/subject_service.js';

async function runForensicAudit() {
    const sapid = 'S90030770'; // Forensic Target
    console.log(`\n🕵️‍♀️ FORENSIC AUDIT: ${sapid} (Standalone Mode)\n`);

    const client = await getClient();

    try {
        // 1. GLOBAL COUNTS
        const counts = {};
        const countTables = ['students', 'curriculum', 'enrollments', 'subjects'];
        for (const t of countTables) {
            const r = await client.query(`SELECT COUNT(*) as c FROM ${t}`);
            counts[t] = parseInt(r.rows[0].c);
        }
        console.log("📊 Global Table Counts:");
        console.table(counts);

        if (counts.enrollments === 0) throw new Error("ROOT CAUSE: Enrollments table is EMPTY.");

        // 2. FETCH STUDENT RAW
        console.log("\n👤 Student Lookup:");
        const sRes = await client.query('SELECT * FROM students WHERE sapid = $1 OR student_id = $1', [sapid]);
        if (sRes.rows.length === 0) throw new Error(`Student not found for SAPID: ${sapid}`);

        const student = sRes.rows[0];
        console.log(`   Found: ${student.name} (${student.sapid})`);
        console.log(`   Raw Program: '${student.program}'`);
        console.log(`   Raw Dept:    '${student.dept}'`);
        console.log(`   Year: ${student.year}, Sem: ${student.semester}`);

        // 3. NORMALIZE KEYS
        const nProg = normalizeProgram(student.program);
        const nBranch = normalizeBranch(student.dept);
        let effectiveProgram = nProg;

        // REPLICATE LOGIC from subject_service.js (Manual check)
        if (effectiveProgram === 'engineering' && nBranch) {
            effectiveProgram = `engineering-${nBranch.toLowerCase()}`;
        }

        console.log("\n🔑 Normalization Logic:");
        console.log(`   Normalized Program: '${nProg}'`);
        console.log(`   Normalized Branch:  '${nBranch}'`);
        console.log(`   EFFECTIVE KEY:      '${effectiveProgram}'`);

        // 4. CHECK CURRICULUM RAW
        console.log("\n📚 Curriculum Check (Raw Query):");
        const currQuery = `
            SELECT subject_code, subject_name FROM curriculum 
            WHERE LOWER(program) = LOWER($1) 
            AND year = $2 
            AND semester = $3
        `;
        const currParams = [effectiveProgram, student.year, student.semester];
        console.log(`   Query: SELECT ... WHERE program='${effectiveProgram}' AND year=${student.year} AND sem=${student.semester}`);

        const currRes = await client.query(currQuery, currParams);
        console.log(`   Rows Found: ${currRes.rows.length}`);
        if (currRes.rows.length > 0) {
            console.table(currRes.rows);
        } else {
            console.log("   ❌ CURRICULUM MISMATCH! Zero rows found.");
            // Probe available programs
            const pRes = await client.query('SELECT DISTINCT program FROM curriculum');
            console.log("   Available in DB:", pRes.rows.map(r => r.program).join(', '));
        }

        // 5. CHECK ENROLLMENTS RAW
        console.log("\n📝 Enrollments Check (Raw Query):");
        const enrollQuery = `SELECT * FROM enrollments WHERE student_id = $1`;
        const enrollRes = await client.query(enrollQuery, [student.student_id]);
        console.log(`   Rows Found: ${enrollRes.rows.length}`);
        if (enrollRes.rows.length > 0) {
            console.log("   ✅ Valid Enrollments exist.");
        } else {
            console.log("   ❌ NO ENROLLMENTS found in 'enrollments' table.");
        }

        // 6. SUBJECT SERVICE RESOLUTION
        console.log("\n🛠 Service Check (getSubjectsForStudent):");
        try {
            const subjectServiceResult = await getSubjectsForStudent(sapid);
            const count = subjectServiceResult.subjects.length;
            console.log(`   Service Returned: ${count} subjects`);
            if (count > 0) {
                console.log("   ✅ Service Logic is WORKING.");
                console.table(subjectServiceResult.subjects.map(s => ({ code: s.subject_code, name: s.subject_name })));
            } else {
                console.log("   ❌ Service Logic FAILED (Returned 0).");
            }
        } catch (e) {
            console.log(`   ❌ Service CRASHED: ${e.message}`);
        }

        console.log("\n✅ FORENSIC AUDIT COMPLETE.");

    } catch (e) {
        console.error(`\n❌ CRITICAL AUDIT FAILURE: ${e.message}`);
    } finally {
        client.release();
        process.exit();
    }
}

runForensicAudit();
