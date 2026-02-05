import dotenv from 'dotenv';
dotenv.config();
import { getClient } from './db.js';

async function setupDebugUser() {
    const client = await getClient();
    try {
        const SAPID = 'S90012023';
        const STUDENT_ID = 'SS90012023';
        console.log(`Setting up user: ${SAPID}`);

        // 1. Create Student
        // Check if exists first to avoid dupes (though I just checked)
        const check = await client.query("SELECT * FROM students WHERE sapid = $1", [SAPID]);
        if (check.rows.length === 0) {
            await client.query(`
                INSERT INTO students (sapid, student_id, password_hash, name, email, program, dept, semester, school, year)
                VALUES ($1, $2, 'password123', 'Debug User', 'debug@test.com', 'B.Tech', 'cse', 4, 'MPSTME', 2)
            `, [SAPID, STUDENT_ID]);
            console.log("✅ Student Created");
        } else {
            console.log("ℹ️ Student already exists. Updating Program/Dept...");
            await client.query("UPDATE students SET program='B.Tech', dept='cse' WHERE sapid=$1", [SAPID]);
        }

        // 2. Enroll in common subjects (copy from S9000000 or just picking known ones)
        // I need valid subject_ids. I'll query some first.
        const subjects = await client.query("SELECT subject_id, code, name FROM subjects LIMIT 3");
        if (subjects.rows.length === 0) {
            console.log("❌ No subjects found in DB to enroll");
            return;
        }

        console.log(`Enrolling in: ${subjects.rows.map(s => s.code).join(', ')}`);

        for (const sub of subjects.rows) {
            // Check enrollment
            const checkEnrol = await client.query(
                "SELECT * FROM enrollments WHERE student_id = $1 AND subject_id = $2",
                [STUDENT_ID, sub.subject_id]
            );

            if (checkEnrol.rows.length === 0) {
                await client.query(
                    "INSERT INTO enrollments (student_id, subject_id) VALUES ($1, $2)",
                    [STUDENT_ID, sub.subject_id]
                );
            }

            // Ensure Curriculum exists for these subjects (needed for analytics)
            // SubjectService performs a JOIN on curriculum.subject_code = subjects.code
            // AND matches program/year/sem.
            // My user is engineering-cse, year 2, sem 4.
            // I must ensure a curriculum entry exists for this combo.

            const currCheck = await client.query(
                "SELECT * FROM curriculum WHERE subject_code = $1 AND program = 'engineering-cse' AND semester = 4",
                [sub.code]
            );

            if (currCheck.rows.length === 0) {
                console.log(`Creating curriculum for ${sub.code}`);
                await client.query(`
                    INSERT INTO curriculum (subject_code, subject_name, program, year, semester, total_classes, min_attendance_pct, school)
                    VALUES ($1, $2, 'engineering-cse', 2, 4, 45, 75, 'MPSTME')
                 `, [sub.code, sub.name]);
            }
        }

        console.log("✅ Setup Complete");

    } catch (e) {
        console.error("Setup Failed:", e);
    } finally {
        client.release();
    }
}

setupDebugUser();
