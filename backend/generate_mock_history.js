
import { getClient, query } from './db.js';

async function generateMockHistory() {
    const client = await getClient();
    try {
        console.log("🚀 Starting Mock History Generator...");

        // 1. Get all students and their enrollments
        // We group by course/semester to generate consistent sessions for the whole class
        const enrollments = await query(`
            SELECT e.student_id, e.subject_id, s.course_id, sub.name as subject_name
            FROM enrollments e
            JOIN students s ON e.student_id = s.student_id
            JOIN subjects sub ON e.subject_id = sub.subject_id
        `);

        if (enrollments.rows.length === 0) {
            console.log("❌ No enrollments found. Cannot generate history.");
            return;
        }

        console.log(`👨‍🎓 Found ${enrollments.rows.length} enrollments.`);

        // 2. Identify unique (Course + Subject) combinations
        // A "Class" is defined by a Course taking a Subject.
        const uniqueClasses = new Set();
        enrollments.rows.forEach(r => {
            if (r.course_id) uniqueClasses.add(`${r.course_id}|${r.subject_id}`);
        });

        console.log(`📚 Found ${uniqueClasses.size} unique classes (Course-Subject pairs).`);

        // 3. Generate Past Sessions for each Class
        const PAST_DAYS = 14; // Generate data for last 2 weeks
        const SESSIONS_PER_SUBJECT = 5;

        let sessionCount = 0;
        let attendanceCount = 0;

        for (const classKey of uniqueClasses) {
            const [courseId, subjectId] = classKey.split('|');

            // Find all students in this class
            const studentsInClass = enrollments.rows.filter(r => r.course_id === courseId && r.subject_id === subjectId);

            for (let i = 0; i < SESSIONS_PER_SUBJECT; i++) {
                // Random date in past 2 weeks
                const daysAgo = Math.floor(Math.random() * PAST_DAYS) + 1; // 1 to 14 days ago
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);
                const dateStr = date.toISOString().split('T')[0];

                // Random time (9AM - 4PM)
                const hour = 9 + Math.floor(Math.random() * 7);
                const startTime = `${hour}:00:00`;
                const endTime = `${hour + 1}:00:00`;

                // Create Session
                const sessionId = `MOCK_SESS_${courseId}_${subjectId}_${i}_${Date.now()}`;

                await client.query(`
                    INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, type, status, room)
                    VALUES ($1, $2, $3, $4, $5, 'Theory', 'conducted', 'Mock Room')
                    ON CONFLICT DO NOTHING
                `, [sessionId, subjectId, dateStr, startTime, endTime]);

                sessionCount++;

                // 4. Mark Attendance for students in this class
                for (const student of studentsInClass) {
                    const isPresent = Math.random() > 0.3; // 70% Attendance Rate
                    const status = isPresent ? 'present' : 'absent';

                    await client.query(`
                        INSERT INTO attendance (session_id, student_id, present, marked_at)
                        VALUES ($1, $2, $3, NOW())
                        ON CONFLICT (session_id, student_id) DO UPDATE SET present=$3
                    `, [sessionId, student.student_id, isPresent]);

                    attendanceCount++;
                }
            }
        }

        console.log(`✅ Success! Generated:`);
        console.log(`   - ${sessionCount} Sessions`);
        console.log(`   - ${attendanceCount} Attendance Records`);
        console.log(`\n🔄 Please refresh the dashboard to see the data.`);

    } catch (e) {
        console.error("❌ Generator Failed:", e);
    } finally {
        client.release();
        process.exit(); // Force exit to kill script
    }
}

generateMockHistory();
