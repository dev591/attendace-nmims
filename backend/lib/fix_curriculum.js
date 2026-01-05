import { query } from '../db.js';

async function fixAndReEnroll() {
    try {
        console.log('🧹 Deleting invalid MBA Semester 2 duplicates...');

        // 1. Delete bad curriculum entries
        const codes = ['MBA101', 'MBA102', 'MBA103', 'MBA104'];
        await query(`
            DELETE FROM curriculum 
            WHERE lower(program) = 'mba' 
              AND subject_code = ANY($1) 
              AND semester = 2
        `, [codes]);

        console.log('✅ Deleted invalid curriculum rows.');

        // 2. Re-Enroll Student 90020054 (MBA Y1 S1)
        console.log('🔄 Re-enrolling student 90020054...');
        const studentId = 'S90020054';

        // We know the course_id for MBA Y1 S1 is likely 'MBA_Y1'... 
        // asking database for it in a real scenario would be better.
        // Let's get the course_id from student table first.
        const sRes = await query('SELECT course_id FROM students WHERE student_id = $1', [studentId]);
        const courseId = sRes.rows[0]?.course_id;

        if (!courseId) {
            console.error('❌ Student has no course_id set.');
            return;
        }

        // Run the fixed Auto-Enroll Query (from index.js)
        await query(`
             INSERT INTO enrollments (student_id, subject_id, section)
             SELECT $1, cs.subject_id, cs.section 
             FROM course_subjects cs
             JOIN subjects s ON cs.subject_id = s.subject_id
             JOIN students stu ON stu.student_id = $1
             JOIN curriculum c ON s.code = c.subject_code 
                  AND LOWER(c.program) = LOWER(stu.program)
             WHERE cs.course_id = $2
               AND c.year = stu.year
               AND c.semester = stu.semester
             ON CONFLICT (student_id, subject_id) DO NOTHING
        `, [studentId, courseId]);

        console.log('✅ Re-enrollment attempted.');

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

fixAndReEnroll();
