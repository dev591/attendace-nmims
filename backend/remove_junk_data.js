
import { query } from './db.js';

async function removeJunkSubjects() {
    console.log("🧹 Removing Junk Subjects (PH11, PH12, PH13, PH14)...");

    // Codes to nuke
    const junkCodes = ['PH11', 'PH12', 'PH13', 'PH14', 'PH111', 'PH112', 'PH113', 'PH114', 'PH115', 'PH15'];

    // 1. Delete from Curriculum
    await query(`DELETE FROM curriculum WHERE subject_code = ANY($1)`, [junkCodes]);

    // 2. Delete from Enrollments (Cascade usually handles this but let's be explicit)
    // First get subject_ids
    const subRes = await query(`SELECT subject_id FROM subjects WHERE code = ANY($1)`, [junkCodes]);
    const ids = subRes.rows.map(r => r.subject_id);

    if (ids.length > 0) {
        await query(`DELETE FROM enrollments WHERE subject_id = ANY($1)`, [ids]);
        await query(`DELETE FROM subjects WHERE subject_id = ANY($1)`, [ids]);
        console.log(`✅ Nuked ${ids.length} junk subjects.`);
    } else {
        console.log("✅ No junk subjects found.");
    }

    process.exit();
}
removeJunkSubjects();
