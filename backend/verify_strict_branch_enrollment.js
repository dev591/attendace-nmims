
import { autoEnrollStudent } from './lib/enrollment_service.js';
import { query } from './db.js';

async function verifyStrictBranch() {
    console.log("🔒 VERIFYING STRICT BRANCH ENROLLMENT...\n");

    const TEST_ID = 'S_STRICT_TEST_01';

    // 1. CLEANUP & SEED
    await query(`DELETE FROM enrollments WHERE student_id = $1`, [TEST_ID]);
    await query(`DELETE FROM students WHERE student_id = $1`, [TEST_ID]);

    await query(`
        INSERT INTO students (student_id, sapid, name, program, dept, year, semester, email, password_hash)
        VALUES ($1, $1, 'Strict Test User', 'Engineering', 'Unknown', 1, 1, 'test@example.com', 'dummy_hash')
    `, [TEST_ID]);

    // 2. TEST CASE: MISSING BRANCH
    console.log("👉 TEST: Engineering + Missing Branch (Should Fail)");
    try {
        await autoEnrollStudent(TEST_ID, 'Engineering', null, 1, 1);
        console.log("   ❌ FAILED: Did not throw error for missing branch.");
    } catch (e) {
        if (e.message.includes("BRANCH_REQUIRED_FOR_ENROLLMENT")) {
            console.log("   ✅ SUCCESS: Caught strict error: BRANCH_REQUIRED_FOR_ENROLLMENT");
        } else {
            console.log(`   ❌ FAILED: Threw unexpected error: ${e.message}`);
        }
    }

    // 3. TEST CASE: Engineering DS (Y1, S1)
    console.log("\n👉 TEST: Engineering + DS (Should Succeed)");
    try {
        const count = await autoEnrollStudent(TEST_ID, 'Engineering', 'DS', 1, 1);
        console.log(`   Enrollment Count: ${count}`);
        if (count > 0) console.log("   ✅ SUCCESS: Enrolled subjects.");
        else console.log("   ⚠️ WARNING: Enrolled 0 (Check if Y1S1 has subjects defined)");
    } catch (e) {
        console.log(`   ❌ ERROR: ${e.message}`);
    }

    // 4. TEST CASE: Engineering CE (Y1, S1)
    console.log("\n👉 TEST: Engineering + CE (Should Succeed)");
    try {
        // Purge first to distinguish
        await query(`DELETE FROM enrollments WHERE student_id = $1`, [TEST_ID]);

        const count = await autoEnrollStudent(TEST_ID, 'Engineering', 'CE', 1, 1);
        console.log(`   Enrollment Count: ${count}`);
        if (count > 0) console.log("   ✅ SUCCESS: Enrolled subjects.");
        else console.log("   ⚠️ WARNING: Enrolled 0");
    } catch (e) {
        console.log(`   ❌ ERROR: ${e.message}`);
    }

    console.log("\n🔒 VERIFICATION COMPLETE.");
    process.exit();
}

verifyStrictBranch();
