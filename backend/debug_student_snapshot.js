
import { getClient } from './db.js';
import { recomputeAnalyticsForStudent } from './lib/analytics.js';

async function debugStudent() {
    const SAPID = '590000004';
    const client = await getClient();
    try {
        console.log(`--- DEBUGGING STUDENT ${SAPID} ---`);

        // 1. Student Details
        const sRes = await client.query('SELECT * FROM students WHERE sapid = $1', [SAPID]);
        if (sRes.rows.length === 0) {
            console.log("Student NOT FOUND in DB");
            return;
        }
        const student = sRes.rows[0];
        console.log("Student Profile:", {
            id: student.student_id,
            program: student.program,
            dept: student.dept,
            year: student.year,
            semester: student.semester
        });

        // 2. Analytics / Subjects (The source of truth for dashboard)
        console.log("\n--- ANALYTICS ENGINE ---");
        const stats = await recomputeAnalyticsForStudent(SAPID);
        const subjects = stats.subjectMetrics;

        console.log(`Enrolled in ${subjects.length} subjects:`);
        subjects.forEach(s => console.log(` - [${s.subject_id}] ${s.subject_name} (${s.subject_code})`));

        const subjectIds = subjects.map(s => s.subject_id);

        if (subjectIds.length === 0) {
            console.log("WARNING: Student has NO subjects. Check 'enrollments' table or 'course_subjects' logic.");
        }

        // 3. Check Sessions for these subjects
        if (subjectIds.length > 0) {
            console.log("\n--- SESSION CHECK ---");
            // Check for ANY sessions for these subjects
            const sessRes = await client.query(`
                SELECT count(*) as total, min(date) as first, max(date) as last
                FROM sessions 
                WHERE subject_id = ANY($1)
            `, [subjectIds]);
            console.log("Session Stats for Enrolled Subjects:", sessRes.rows[0]);

            // Check Specifically for JAN 2026
            const janRes = await client.query(`
                SELECT * FROM sessions 
                WHERE subject_id = ANY($1)
                AND date >= '2026-01-01'
                ORDER BY date ASC LIMIT 5
            `, [subjectIds]);

            console.log(`\nSessions found in Jan 2026: ${janRes.rows.length}`);
            janRes.rows.forEach(s => {
                console.log(` - ${s.date.toISOString().split('T')[0]} ${s.start_time}: ${s.subject_id}`);
            });
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        client.release();
        process.exit();
    }
}

debugStudent();
