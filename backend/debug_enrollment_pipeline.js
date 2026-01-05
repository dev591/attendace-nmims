import { query } from './db.js';

async function debug() {
    try {
        const studentId = 'S90020054';

        // 1. Get Course ID
        const sRes = await query('SELECT course_id, program, year, semester FROM students WHERE student_id = $1', [studentId]);
        const student = sRes.rows[0];
        console.log('Student:', student);

        if (!student.course_id) {
            console.log('No course ID');
            return;
        }

        // 2. Check Course Subjects
        console.log(`\nChecking course_subjects for course: ${student.course_id}...`);
        const csRes = await query(`
            SELECT cs.subject_id, s.code, s.name 
            FROM course_subjects cs
            JOIN subjects s ON cs.subject_id = s.subject_id
            WHERE cs.course_id = $1
        `, [student.course_id]);

        console.log(`Found ${csRes.rows.length} entries in course_subjects:`);
        csRes.rows.forEach(r => console.log(`- ${r.code}: ${r.name} (${r.subject_id})`));

        // 3. Check Curriculum Match for these subjects
        console.log('\nChecking Curriculum Matches (Student Config: Y1 S1, MBA)...');

        for (const sub of csRes.rows) {
            const curRes = await query(`
                SELECT * FROM curriculum 
                WHERE subject_code = $1 
                  AND lower(program) = 'mba'
            `, [sub.code]);

            if (curRes.rows.length === 0) {
                console.log(`❌ ${sub.code}: No curriculum entry found.`);
            } else {
                curRes.rows.forEach(c => {
                    const match = (c.year === student.year && c.semester === student.semester);
                    console.log(`${match ? '✅' : '❌'} ${sub.code}: Found Curric entry Y${c.year} S${c.semester} (ID: ${c.code})`);
                });
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

debug();
