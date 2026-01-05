
import { getSubjectsForStudent } from './lib/subject_service.js';

async function testFix() {
    const sapid = 'S90030770'; // Testing 'S'-prefixed ID behavior
    console.log(`Testing getSubjectsForStudent for ID: ${sapid}`);

    try {
        const result = await getSubjectsForStudent(sapid);

        console.log("\n--- RESULT ---");
        console.log(`Student Program: ${result.student.program}`);
        console.log(`Student Dept:    ${result.student.dept}`);
        console.log(`Resolved Prog:   ${result.student.normalized_program}`);
        console.log(`Subject Count:   ${result.subjects.length}`);

        if (result.subjects.length > 0) {
            console.log("\n✅ SUCCESS! Subjects found.");
            console.table(result.subjects);
        } else {
            console.log("\n❌ FAILURE! Still 0 subjects.");
        }
    } catch (e) {
        console.error("CRITICAL ERROR:", e);
    }
    process.exit();
}

testFix();
