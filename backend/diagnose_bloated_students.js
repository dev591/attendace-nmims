
import { query } from './db.js';

async function diagnose() {
    console.log("🔍 Scanning for students with excess enrollments (>6)...");
    try {
        const res = await query(`
            SELECT e.student_id, s.name, s.program, s.year, s.semester, COUNT(*) as subject_count
            FROM enrollments e
            JOIN students s ON e.student_id = s.student_id
            GROUP BY e.student_id, s.name, s.program, s.year, s.semester
            HAVING COUNT(*) > 6
            ORDER BY subject_count DESC
        `);

        if (res.rows.length === 0) {
            console.log("✅ No bloated students found!");
        } else {
            console.log(`⚠️ Found ${res.rows.length} students with excess subjects:`);
            console.table(res.rows);

            // Pick the first one and dump their subjects to see WHAT they are
            const victim = res.rows[0];
            console.log(`\n🕵️ Deep Dive on ${victim.student_id} (${victim.name}):`);
            const subRes = await query(`
                SELECT s.code, s.name, c.semester, c.year
                FROM enrollments e
                JOIN subjects s ON e.subject_id = s.subject_id
                LEFT JOIN curriculum c ON s.code = c.subject_code
                WHERE e.student_id = $1
            `, [victim.student_id]);
            console.table(subRes.rows);
        }
    } catch (e) {
        console.error("Diagnosis Failed:", e);
    } finally {
        process.exit();
    }
}
diagnose();
