/* ADDED BY ANTI-GRAVITY */
import { query } from './db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function verifyDataFlow() {
    console.log("🔍 Starting Data Integrity Audit...");

    try {
        // 1. Pick a random student or allow arg
        const targetId = process.argv[2] || 'S001';
        console.log(`👤 Auditing Student: ${targetId}`);

        // 2. Check Student Existence
        const studentRes = await query('SELECT * FROM students WHERE student_id = $1', [targetId]);
        if (studentRes.rows.length === 0) {
            console.error("❌ Student not found in DB.");
            process.exit(1);
        }
        const student = studentRes.rows[0];
        console.log(`✅ Student Found: ${student.name} (SAPID: ${student.sapid}, Course: ${student.course_id})`);

        // 3. Check Subjects/Enrollments
        const enrollRes = await query(`
            SELECT s.subject_id, s.name, s.credits
            FROM subjects s
            JOIN enrollments e ON s.subject_id = e.subject_id
            WHERE e.student_id = $1
        `, [targetId]);

        let subjects = enrollRes.rows;
        if (subjects.length === 0) {
            console.log("⚠️ No specific enrollments. Checking Course-based default...");
            const courseRes = await query(`
                SELECT s.subject_id, s.name
                FROM subjects s
                JOIN course_subjects cs ON s.subject_id = cs.subject_id
                WHERE cs.course_id = $1
            `, [student.course_id]);
            subjects = courseRes.rows;
        }

        console.log(`📚 Subjects Enrolled: ${subjects.length}`);
        if (subjects.length === 0) {
            console.warn("⚠️ No subjects found for student!");
        }

        // 4. Validate Attendance Logic vs DB
        console.log("\n📊 Validating Attendance Stats...");
        for (const sub of subjects) {
            // Raw DB Counts
            const totalSesRes = await query('SELECT COUNT(*) FROM sessions WHERE subject_id = $1', [sub.subject_id]);
            const conductedRes = await query('SELECT COUNT(*) FROM sessions WHERE subject_id = $1 AND status = \'conducted\'', [sub.subject_id]);
            const attendedRes = await query(`
                SELECT COUNT(*) FROM attendance a 
                JOIN sessions s ON a.session_id = s.session_id
                WHERE a.student_id = $1 AND s.subject_id = $2 AND (a.present = true OR a.present = '1')
            `, [targetId, sub.subject_id]);

            const T = parseInt(totalSesRes.rows[0].count);
            const C = parseInt(conductedRes.rows[0].count);
            const A = parseInt(attendedRes.rows[0].count);

            console.log(`   [${sub.name}] T=${T}, C=${C}, A=${A}`);

            if (T === 0 && C > 0) console.warn("   ❌ LOGIC ERROR: Conducted > Total? Check session data.");
            if (A > C) console.warn("   ❌ LOGIC ERROR: Attended > Conducted? Check attendance data.");
        }

        // 5. Check Badges
        const badgesRes = await query('SELECT b.name FROM student_badges sb JOIN badges b ON sb.badge_id = b.id WHERE sb.student_id = $1', [targetId]);
        console.log(`\n🏆 Badges Awarded: ${badgesRes.rows.map(b => b.name).join(', ') || 'None'}`);

        console.log("\n✅ Audit Complete. If 'LOGIC ERROR' is expected (e.g. data mismatch), fix DB data.");
        process.exit(0);

    } catch (e) {
        console.error("❌ Audit Error:", e);
        process.exit(1);
    }
}

verifyDataFlow();
