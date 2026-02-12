
import pg from 'pg';
import dotenv from 'dotenv';
import { normalizeProgram } from './lib/program_mapper.js';
import { normalizeBranch } from './lib/program_branch_mapper.js';

dotenv.config();

const pool = new pg.Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

async function syncEnrollments() {
    console.log("Starting Enrollment Sync (Smart Branch Matching)...");
    const client = await pool.connect();

    try {
        // 1. Get All Students
        const studentsRes = await client.query('SELECT student_id, sapid, program, dept, year, semester FROM students');
        const students = studentsRes.rows;
        console.log(`Found ${students.length} students.`);

        let totalEnrolled = 0;
        let processed = 0;

        for (const student of students) {
            // PURE CLEANUP: Remove old enrollments for this semester to fix duplicates/over-enrollment
            await client.query('DELETE FROM enrollments WHERE student_id = $1 AND semester = $2', [student.student_id, student.semester]);

            // Normalize Program & Branch
            let searchProgram = normalizeProgram(student.program);
            const branch = normalizeBranch(student.dept);

            let candidatePrograms = [];

            // PRIORITY 1: Engineering Branch specific (e.g., engineering-ce)
            if (searchProgram === 'engineering' && branch) {
                candidatePrograms.push(`${searchProgram}-${branch}`);
            }

            // PRIORITY 2: Generic Program (e.g., engineering, mba, law)
            candidatePrograms.push(searchProgram);

            let subjects = [];
            let matchedProgram = null;

            // Try candidates in order
            for (const prog of candidatePrograms) {
                const subjectsRes = await client.query(`
                    SELECT s.subject_id, c.subject_code 
                    FROM curriculum c
                    JOIN subjects s ON c.subject_code = s.code
                    WHERE LOWER(c.program) = $1
                    AND c.year = $2 
                    AND c.semester = $3
                `, [
                    prog.toLowerCase(),
                    student.year,
                    student.semester
                ]);

                if (subjectsRes.rows.length > 0) {
                    subjects = subjectsRes.rows;
                    matchedProgram = prog;
                    break; // Found matches, stop looking (Don't mix generic with specific if specific found)
                }
            }

            if (subjects.length > 0) {
                // Bulk Insert Enrollments
                for (const sub of subjects) {
                    await client.query(`
                        INSERT INTO enrollments (student_id, subject_id, semester)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (student_id, subject_id) DO NOTHING
                    `, [student.student_id, sub.subject_id, student.semester]);
                }

                totalEnrolled += subjects.length;
            } else {
                // console.warn(`[${student.sapid}] NO CURRICULUM FOUND. Tried: ${candidatePrograms.join(', ')}`);
            }
            processed++;
            if (processed % 50 === 0) console.log(`Processed ${processed}/${students.length} students...`);
        }

        console.log(`\nSync Complete! Total Enrollments Created: ${totalEnrolled}`);

    } catch (e) {
        console.error("Sync Failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

syncEnrollments();
