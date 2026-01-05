
import { query } from './db.js';

async function patchAndFix() {
    console.log("🩹 Patching data consistency...");

    // 1. Fix Year-Semester Mismatches
    // Logic: Year is derived from Semester. (Sem 1,2 -> Year 1; Sem 3,4 -> Year 2)
    const patch = await query(`
        UPDATE students 
        SET year = CEIL(semester / 2.0)
        WHERE semester IS NOT NULL 
        AND year != CEIL(semester / 2.0)
        RETURNING student_id, name, year, semester
    `);

    if (patch.rows.length > 0) {
        console.log(`✅ Fixed ${patch.rows.length} mismatched records (Year updated to match Semester):`);
        console.table(patch.rows);
    } else {
        console.log("ℹ️ No Year-Semester mismatches found.");
    }

    // 2. Fix 'uuid-test-001' (The 65-subject monster)
    // Likely missing program context. Let's give it a valid context or wipe it.
    // Setting it to Engineering Y1 S1 so it gets cleaned up properly.
    const zombie = await query(`
        UPDATE students 
        SET program = 'Engineering', year = 1, semester = 1, course_id = 'Engineering'
        WHERE student_id = 'uuid-test-001'
        RETURNING student_id, name
    `);
    if (zombie.rows.length > 0) console.log("🧟 revitalized zombie user 'uuid-test-001' with valid context.");

    process.exit();
}
patchAndFix();
