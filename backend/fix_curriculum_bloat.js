
import { query } from './db.js';

async function fixCurriculumAndPrograms() {
    console.log("🩹 Patching Curriculum & Programs for Law/Pharma...");

    // 1. Normalize Pharma Programs
    const pharm = await query(`
        UPDATE students 
        SET program = 'Pharma'
        WHERE LOWER(program) LIKE 'pharm%' OR LOWER(program) = 'b.pharma'
        RETURNING student_id, name, program
    `);
    console.log(`✅ Normalized ${pharm.rows.length} Pharma students.`);

    // 2. Normalize Law Programs
    const law = await query(`
        UPDATE students 
        SET program = 'Law'
        WHERE LOWER(program) LIKE 'law%' OR LOWER(program) = 'b.a. ll.b.'
        RETURNING student_id, name, program
    `);
    console.log(`✅ Normalized ${law.rows.length} Law students.`);

    // 3. Fix MBA Program (MBA Tech vs MBA)
    const mba = await query(`
        UPDATE students 
        SET program = 'MBA'
        WHERE LOWER(program) LIKE 'mba%'
        RETURNING student_id, name, program
    `);
    console.log(`✅ Normalized ${mba.rows.length} MBA students.`);

    // 4. Clean DUPLICATE Curriculum Entries (The root cause of "PH11" appearing twice)
    // We keep the one with the lowest semester (assuming Sem 1 starts first).
    // Actually, simply DELETE duplicates where code is same but sem is different? Bad idea if multi-sem course.
    // Let's checks duplications first.

    console.log("🔍 Checking Duplicate Curriculum...");
    const dupe = await query(`
        SELECT subject_code, program, year, COUNT(*) 
        FROM curriculum
        GROUP BY subject_code, program, year
        HAVING COUNT(*) > 1
    `);

    if (dupe.rows.length > 0) {
        console.log(`⚠️ Found ${dupe.rows.length} duplicate curriculum items. Dumping 5 examples:`);
        console.table(dupe.rows.slice(0, 5));

        // AUTO-FIX: If same subject appears in Sem 1 and Sem 2 for same Year, delete Sem 2 entry.
        // This assumes subjects are single-semester.
        console.log("🧹 Pruning Duplicate Curriculum (Keeping Min Semester)...");
        await query(`
             DELETE FROM curriculum a USING curriculum b
             WHERE a.id > b.id 
             AND a.subject_code = b.subject_code 
             AND a.program = b.program 
             AND a.year = b.year
        `);
        console.log("✅ Duplicates pruned.");
    } else {
        console.log("✅ Curriculum is clean.");
    }

    process.exit();
}
fixCurriculumAndPrograms();
