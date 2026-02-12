
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

async function diagnose() {
    const client = await pool.connect();
    try {
        const sapid = '590000005'; // The student from the user's log
        console.log(`Diagnosing for SAPID: ${sapid}`);

        const res = await client.query('SELECT * FROM students WHERE sapid = $1', [sapid]);
        if (res.rows.length === 0) {
            console.log('Student not found!');
            return;
        }
        const student = res.rows[0];
        console.log('Student Profile:', {
            program: student.program,
            dept: student.dept,
            year: student.year,
            semester: student.semester
        });

        const searchProgram = normalizeProgram(student.program);
        console.log(`Normalized Program: '${searchProgram}'`);

        // Run the EXACT query from sync_enrollments.js
        const query = `
            SELECT c.id, c.program, c.subject_code, c.subject_name 
            FROM curriculum c
            WHERE (LOWER(c.program) = $1 OR LOWER(c.program) LIKE $2)
            AND c.year = $3 
            AND c.semester = $4
        `;
        const params = [
            searchProgram.toLowerCase(),
            `%${searchProgram.toLowerCase()}%`,
            student.year,
            student.semester
        ];

        console.log('Running Curriculum Query with:', params);
        const currRes = await client.query(query, params);

        console.log(`\nFound ${currRes.rows.length} matches in Curriculum:`);
        currRes.rows.forEach(r => {
            console.log(`- [${r.program}] ${r.subject_code}: ${r.subject_name}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

diagnose();
