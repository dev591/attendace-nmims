
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
import { recomputeAnalyticsForStudent } from './lib/analytics.js';
import { getClient, query } from './db.js';
import { section } from 'framer-motion/client';

async function verifyGlobalStrictLogic() {
    console.log("🛡️ STARTING GLOBAL STRICT LOGIC VERIFICATION");
    const client = await getClient();

    try {
        // 1. Setup Test Data (Student + Course + Subject linkage)
        const testSapid = "STRICT_TEST_001";
        const testCourse = "STRICT_COURSE_01";
        const testSubject = "STRICT_SUB_01";

        console.log(`\n🔹 Setting up Test Data: ${testSapid} enrolled in ${testCourse}...`);

        // Cleanup old
        await query("DELETE FROM student_badges WHERE student_id = $1", [testSapid]);
        await query("DELETE FROM attendance WHERE student_id = $1", [testSapid]);
        await query("DELETE FROM students WHERE sapid = $1", [testSapid]);
        await query("DELETE FROM course_subjects WHERE course_id = $1", [testCourse]);
        await query("DELETE FROM courses WHERE course_id = $1", [testCourse]);
        await query("DELETE FROM subjects WHERE subject_id = $1", [testSubject]);

        // Create Course
        await query("INSERT INTO courses (course_id, name, dept, year) VALUES ($1, 'Strict Mode Course', 'Test Dept', 1)", [testCourse]);

        // Create Subject
        await query("INSERT INTO subjects (subject_id, name, code) VALUES ($1, 'Strict Theory', 'ST101') ON CONFLICT (subject_id) DO NOTHING", [testSubject]);

        // Link Subject to Course (if needed for other logic)
        await query("INSERT INTO course_subjects (course_id, subject_id, section) VALUES ($1, $2, 'A')", [testCourse, testSubject]);

        // 1.5. Setup Curriculum (Required for PostgresProvider.getSubjectEnrollments query)
        // It joins on curriculum relative to program/year/semester
        await query("DELETE FROM curriculum WHERE subject_code = 'ST101'");
        await query(`
            INSERT INTO curriculum (program, year, semester, subject_code, subject_name, total_classes, min_attendance_pct)
            VALUES ('Engineering', 1, 1, 'ST101', 'Strict Theory', 40, 75)
        `);

        // Create Student linked to Course
        await query(`
            INSERT INTO students (student_id, sapid, name, password_hash, program, year, dept, semester, course_id)
            VALUES ($1, $2, 'Strict Logic Tester', 'hash', 'Engineering', 1, 'Test Dept', 1, $3)
        `, [testSapid, testSapid, testCourse]);

        // 1.6. Explicit Enrollment (Required for PostgresProvider query)
        await query("DELETE FROM enrollments WHERE student_id = $1", [testSapid]);
        await query(`
            INSERT INTO enrollments (student_id, subject_id)
            VALUES ($1, $2)
        `, [testSapid, testSubject]);

        // 2. RUN ANALYTICS (Fresh User)
        console.log(`\n🔹 Computing Analytics for ${testSapid} (Expect: NO_DATA / 100%)...`);
        const result = await recomputeAnalyticsForStudent(testSapid);

        const { risk_summary, attendanceRate } = result.analytics;

        // 3. ASSERTIONS
        let passed = true;

        if (attendanceRate !== 100) {
            console.error(`❌ FAIL: Expected 100% attendance, got ${attendanceRate}%`);
            passed = false;
        } else {
            console.log(`✅ PASS: Attendance Rate is 100%`);
        }

        if (risk_summary.heroStatus !== 'NO_DATA') {
            console.error(`❌ FAIL: Expected heroStatus 'NO_DATA', got '${risk_summary.heroStatus}'`);
            passed = false;
        } else {
            console.log(`✅ PASS: Hero Status is 'NO_DATA'`);
        }

        if (risk_summary.overallPct !== 100) {
            console.error(`❌ FAIL: Expected overallPct 100, got ${risk_summary.overallPct}`);
            passed = false;
        } else {
            console.log(`✅ PASS: Overall Pct is 100%`);
        }

        // 4. CHECK SUBJECTS
        const subs = result.subjectMetrics;
        if (subs.length === 0) {
            console.warn("⚠️ WARNING: No subjects found for test student. Verification weak.");
        } else {
            console.log(`\n🔹 Verifying ${subs.length} Subjects...`);
            subs.forEach(s => {
                if (s.status !== 'NO_DATA') {
                    console.error(`❌ FAIL Subject ${s.subject_code}: Status is ${s.status}, expected NO_DATA`);
                    passed = false;
                } else {
                    console.log(`✅ Subject ${s.subject_code}: Status NO_DATA, Pct ${s.attendance_percentage}%`);
                }
            });
        }

        if (passed) {
            console.log("\n🌟 SUCCESS: Strict Global Logic Holds for Fresh Users.");
        } else {
            console.error("\n💀 FAILURE: Logic gaps detected.");
        }

    } catch (err) {
        console.error("❌ CRITICAL ERROR during verification:", err);
    } finally {
        // Cleanup? Optional. Keep for manual debug.
        client.release();
        process.exit();
    }
}

verifyGlobalStrictLogic();
