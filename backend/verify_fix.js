import { getSubjectsForStudent } from './lib/subject_service.js';
// import { pool } from './db.js';

async function verify() {
    try {
        const sapid = '90020054'; // MBA Student from cleanup logs
        console.log(`Checking subjects for ${sapid}...`);
        const { subjects } = await getSubjectsForStudent(sapid);

        console.log(`\nFound ${subjects.length} subjects:`);
        subjects.forEach(s => console.log(`- ${s.subject_code}: ${s.subject_name}`));

        if (subjects.length === 5) {
            console.log('\n✅ PASS: Exact expected count (5).');
        } else {
            console.log(`\n❌ FAIL: Expected 5, got ${subjects.length}.`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        // process.exit(); // failing to import pool again? db.js pool is not exported?
        // Ah, subject_service uses query(). I don't need pool here if I don't use it directly.
        process.exit();
    }
}

verify();
