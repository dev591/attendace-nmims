import { query } from '../db.js';

async function reEnrollDirect() {
    try {
        const studentId = 'S90020054';
        console.log(`🔄 Re-enrolling ${studentId} using Curriculum Direct Mode...`);

        // 1. Get Student Context
        const sRes = await query('SELECT program, year, semester FROM students WHERE student_id = $1', [studentId]);
        const stu = sRes.rows[0];
        console.log('Student Context:', stu);

        // 2. Direct Query: Subjects matching Program + Year + Sem
        const q = `
            INSERT INTO enrollments (student_id, subject_id, section)
            SELECT $1, s.subject_id, 'A'
            FROM subjects s
            JOIN curriculum c ON s.code = c.subject_code
            WHERE lower(c.program) = lower($2)
              AND c.year = $3
              AND c.semester = $4
            ON CONFLICT (student_id, subject_id) DO NOTHING
            RETURNING subject_id
        `;

        const res = await query(q, [studentId, stu.program, stu.year, stu.semester]);
        console.log(`✅ Enrolled in ${res.rowCount} subjects.`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

reEnrollDirect();
