import { calcAttendanceStats } from './attendance_analytics.js';
import { query } from './db.js';

async function verify() {
    try {
        // Find a student with enrollments
        const res = await query('SELECT student_id FROM enrollments LIMIT 1');
        if (res.rows.length === 0) {
            console.log('No students with enrollments found.');
            return;
        }
        const studentId = res.rows[0].student_id;

        // Find a subject for this student
        const subRes = await query('SELECT subject_id FROM enrollments WHERE student_id = $1 LIMIT 1', [studentId]);
        const subjectId = subRes.rows[0].subject_id;

        console.log(`Testing Analytics for Student: ${studentId}, Subject: ${subjectId}`);
        const stats = await calcAttendanceStats(studentId, subjectId);

        console.log('\n--- Analytics Result ---');
        console.log(`Percentage: ${stats.percentage}%`);
        console.log(`Confidence: ${stats.confidence}`); // Should be HIGH/MEDIUM/LOW
        console.log(`Is Safe: ${stats.is_safe}`);       // Should be true/false

        if (stats.confidence && stats.is_safe !== undefined) {
            console.log('\n✅ PASS: New fields present.');
        } else {
            console.log('\n❌ FAIL: Missing fields.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

verify();
