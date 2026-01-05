import { query } from '../db.js';

async function strictCleanup() {
    console.log('🚀 Starting STRICT Subject Cleanup...');

    try {
        // 1. Identify Invalid Enrollments
        // We join enrollments -> subjects -> curriculum
        // And compare with student -> year, semester, program

        // Note: We need to match curriculum by subject_code and program

        const fetchQuery = `
            SELECT 
                e.id as enrollment_id,
                e.student_id,
                s.code as subject_code,
                stu.program,
                stu.year as student_year,
                stu.semester as student_semester,
                c.year as subject_year,
                c.semester as subject_semester
            FROM enrollments e
            JOIN students stu ON e.student_id = stu.student_id
            JOIN subjects s ON e.subject_id = s.subject_id
            JOIN curriculum c ON s.code = c.subject_code 
                 AND LOWER(c.program) = LOWER(stu.program) -- Match program context
        `;

        console.log('🔍 Analyzing enrollments...');
        const { rows } = await query(fetchQuery);

        const invalidEnrollments = [];

        for (const row of rows) {
            // STRICT COMPARISON
            const yearMismatch = row.student_year !== row.subject_year;
            const semMismatch = row.student_semester !== row.subject_semester;

            if (yearMismatch || semMismatch) {
                invalidEnrollments.push(row.enrollment_id);
                console.log(`❌ MARKED FOR DELETION: Student ${row.student_id} (${row.program} Y${row.student_year} S${row.student_semester}) has subject ${row.subject_code} (Y${row.subject_year} S${row.subject_semester})`);
            }
        }

        if (invalidEnrollments.length > 0) {
            console.log(`🔥 Deleting ${invalidEnrollments.length} invalid enrollments...`);
            // Batch delete
            // Postgres supports ANY() for arrays
            await query(`DELETE FROM enrollments WHERE id = ANY($1::int[])`, [invalidEnrollments]);
            console.log('✅ Cleanup Complete.');
        } else {
            console.log('✨ No invalid enrollments found. System is clean.');
        }

    } catch (e) {
        console.error('💥 Cleanup Failed:', e);
    } finally {
        process.exit();
    }
}

strictCleanup();
