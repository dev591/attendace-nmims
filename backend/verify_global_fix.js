
import { query } from './db.js';

async function verify() {
    console.log("🕵️ Verifying Fix Results...");

    // 1. Check Dev Chalana (S001 / uuid-test-001)
    const dev = await query(`
        SELECT s.student_id, s.name, count(e.subject_id) as count 
        FROM students s 
        LEFT JOIN enrollments e ON s.student_id = e.student_id
        WHERE s.name LIKE '%Dev Chalana%' OR s.student_id = 'uuid-test-001'
        GROUP BY s.student_id, s.name
    `);
    console.log("\n👤 Dev Chalana Status:");
    console.table(dev.rows);

    // 2. Check Law Sem 2 Curriculum Count
    const law = await query(`
        SELECT count(*) as curriculum_count 
        FROM curriculum 
        WHERE LOWER(program) = 'law' AND semester = 2 AND year = 1
    `);
    console.log(`\n⚖️ Law Sem 2 Curriculum Count: ${law.rows[0].curriculum_count}`);

    process.exit();
}
verify();
