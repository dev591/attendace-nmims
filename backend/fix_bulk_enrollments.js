
import { getClient } from './db.js';

async function bulkEnroll() {
    const client = await getClient();
    try {
        console.log("=== BULK ENROLLMENT FIX ===");

        // Strategy: Enroll each student into every subject that has sessions scheduled for their Sem+Sec.
        // This ensures the Timetable is fully visible.

        const query = `
            INSERT INTO enrollments (student_id, subject_id)
            SELECT DISTINCT s.student_id, ses.subject_id
            FROM students s
            JOIN sessions ses ON s.semester = ses.semester 
                             AND (ses.section IS NULL OR ses.section = s.section)
            WHERE NOT EXISTS (
                SELECT 1 FROM enrollments e 
                WHERE e.student_id = s.student_id AND e.subject_id = ses.subject_id
            )
            RETURNING student_id
        `;

        const res = await client.query(query);
        console.log(`✅ Successfully created ${res.rowCount} new enrollments.`);

        if (res.rowCount > 0) {
            console.log("Sample IDs fixed:", res.rows.slice(0, 3).map(r => r.student_id));
        }

    } catch (e) {
        console.error("Bulk Fix Failed:", e);
    } finally {
        client.release();
    }
}

bulkEnroll();
