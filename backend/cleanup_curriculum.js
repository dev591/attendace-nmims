
import { query, getClient } from './db.js';
import { autoEnrollStudent } from './lib/enrollment_service.js';

async function cleanupLegacyCurriculum() {
    console.log("🧹 STARTING CURRICULUM CLEANUP (Keeping Set 2: DS10xx)...");
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Target Legacy Codes
        const legacyCodes = ['DS11', 'DS12', 'DS13', 'DS14', 'DS15'];
        console.log(`🎯 Targets: ${legacyCodes.join(', ')}`);

        // 1. Delete Enrollments first (Safety)
        const eRes = await client.query(`
            DELETE FROM enrollments 
            WHERE subject_id IN (SELECT subject_id FROM subjects WHERE subject_id = ANY($1))
        `, [legacyCodes]);
        console.log(`   - Deleted ${eRes.rowCount} legacy enrollments.`);

        // 2. Delete Curriculum Entries
        const cRes = await client.query(`
            DELETE FROM curriculum 
            WHERE subject_code = ANY($1)
        `, [legacyCodes]);
        console.log(`   - Deleted ${cRes.rowCount} curriculum entries.`);

        // 3. Delete Subjects (Master)
        const sRes = await client.query(`
            DELETE FROM subjects 
            WHERE subject_id = ANY($1)
        `, [legacyCodes]);
        console.log(`   - Deleted ${sRes.rowCount} subject master records.`);

        await client.query('COMMIT');
        console.log("✅ COMMIT SUCCESS.");

        // 4. Force Re-enrollment for verification (Optional, but good sanity check)
        // We just verified 90030002
        console.log("🔄 Verifying 90030002 state...");
        const vRes = await query("SELECT count(*) FROM enrollments WHERE student_id = (SELECT student_id FROM students WHERE sapid='90030002')");
        console.log(`   - Current Enrollment Count: ${vRes.rows[0].count} (Should be 5)`);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ CLEANUP FAILED:", e);
    } finally {
        client.release();
        process.exit();
    }
}

cleanupLegacyCurriculum();
