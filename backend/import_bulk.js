import { query, getClient } from './db.js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { evaluateBadgesForAll } from './badges_service.js'; // ADDED BY ANTI-GRAVITY

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readCsv = (filename) => {
    const filePath = path.join(__dirname, 'csv_templates', filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${filename}. Skipping.`);
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return parse(content, { columns: true, skip_empty_lines: true, trim: true });
};

const importBulk = async () => {
    const client = await getClient();
    try {
        console.log('🚀 Starting Bulk Import...');

        // 1. Run Migration to ensure tables exist
        const migrationSql = fs.readFileSync(path.join(__dirname, 'migration_add_courses.sql'), 'utf8');
        await client.query(migrationSql);
        console.log('✅ Migration applied.');

        // 2. Import Courses
        const courses = readCsv('courses.csv');
        for (const row of courses) {
            await client.query(`
                INSERT INTO courses (course_id, name, year, dept)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (course_id) DO UPDATE SET name=$2, year=$3, dept=$4
            `, [row.course_id, row.name, parseInt(row.year), row.dept]);
        }
        console.log(`📦 Courses imported: ${courses.length}`);

        // 3. Import Subjects
        const subjects = readCsv('subjects.csv');
        for (const row of subjects) {
            try {
                await client.query(`
                    INSERT INTO subjects (subject_id, code, name, credits)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (subject_id) DO UPDATE SET code=$2, name=$3, credits=$4
                `, [row.subject_id, row.code, row.name, parseInt(row.credits) || 3]);
            } catch (err) {
                if (err.code === '23505') { // Unique violation (likely status code)
                    console.warn(`⚠️ Skipped duplicate subject code: ${row.code}`);
                } else {
                    throw err;
                }
            }
        }
        console.log(`📚 Subjects imported: ${subjects.length}`);

        // 4. Import Course-Subjects
        const courseSubjects = readCsv('course_subjects.csv');
        for (const row of courseSubjects) {
            await client.query(`
                INSERT INTO course_subjects (course_id, subject_id, faculty_name, section)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (course_id, subject_id) DO UPDATE SET faculty_name=$3, section=$4
            `, [row.course_id, row.subject_id, row.faculty_name, row.section]);
        }
        console.log(`🔗 Course-Subjects linked: ${courseSubjects.length}`);

        // 5. Import Students
        const students = readCsv('students.csv');
        for (const row of students) {
            // If password_hash is provided in CSV, update it. Else keep existing.
            // If sapid provided, ensure uniqueness.
            if (!row.sapid) continue;

            try {
                await client.query(`
                    INSERT INTO students (student_id, sapid, password_hash, name, email, program, year, dept, course_id, semester)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (student_id) DO UPDATE SET 
                        sapid=$2, 
                        name=$4, email=$5, program=$6, year=$7, dept=$8, course_id=$9, semester=$10,
                        password_hash = CASE WHEN EXCLUDED.password_hash IS NOT NULL AND EXCLUDED.password_hash <> '' THEN EXCLUDED.password_hash ELSE students.password_hash END
                 `, [
                    row.student_id, row.sapid, row.password_hash, row.name, row.email,
                    row.program, parseInt(row.year), row.dept, row.course_id || null,
                    parseInt(row.semester) || 1
                ]);
            } catch (err) {
                if (err.code === '23505') { // Unique violation (legacy SAPID or Email collision)
                    console.warn(`⚠️ Skipped duplicate student: ${row.sapid} / ${row.email}`);
                } else { throw err; }
            }

            // Auto-Enroll based on course_id
            if (row.course_id) {
                await client.query(`
                    INSERT INTO enrollments (student_id, subject_id, section)
                    SELECT $1, subject_id, section 
                    FROM course_subjects 
                    WHERE course_id = $2
                    ON CONFLICT (student_id, subject_id) DO NOTHING
                 `, [row.student_id, row.course_id]);
            }
        }
        console.log(`👨‍🎓 Students imported: ${students.length}`);

        // 6. Import Sessions
        const sessions = readCsv('sessions.csv');
        for (const row of sessions) {
            await client.query(`
                INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, location, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (session_id) DO UPDATE SET status=$7, location=$6
            `, [row.session_id, row.subject_id, row.date, row.start_time, row.end_time || '10:00', row.location, row.status]);
        }
        console.log(`📅 Sessions imported: ${sessions.length}`);

        // 7. Import Attendance
        const attendance = readCsv('attendance.csv');
        let attCount = 0;
        let skipped = 0;
        for (const row of attendance) {
            // Check session existence
            const sessRes = await client.query('SELECT 1 FROM sessions WHERE session_id = $1', [row.session_id]);
            if (sessRes.rowCount === 0) {
                console.warn(`Skipping attendance for unknown session: ${row.session_id}`);
                skipped++;
                continue;
            }

            // Resolve Student ID (support roll_no or sapid or student_id if needed, but CSV template mainly uses IDs or SAPIDs)
            // Assuming simplified CSV: session_id, student_sapid, present
            let sId = null;
            if (row.student_id) sId = row.student_id;
            else if (row.student_sapid) {
                const s = await client.query('SELECT student_id FROM students WHERE sapid = $1', [row.student_sapid]);
                if (s.rows.length > 0) sId = s.rows[0].student_id;
            } else if (row.student_roll_no) { // Keep legacy support
                const s = await client.query('SELECT student_id FROM students WHERE roll_no = $1', [row.student_roll_no]);
                if (s.rows.length > 0) sId = s.rows[0].student_id;
            }

            if (sId) {
                await client.query(`
                    INSERT INTO attendance (session_id, student_id, present, source)
                    VALUES ($1, $2, $3, 'bulk_import')
                    ON CONFLICT (session_id, student_id) DO UPDATE SET present = EXCLUDED.present
                `, [row.session_id, sId, row.present === 'true']);
                attCount++;
            } else {
                skipped++;
            }
        }
        console.log(`✅ Attendance imported: ${attCount} (Skipped: ${skipped})`);

        /* ADDED BY ANTI-GRAVITY: Badge Evaluation Hook */
        if (!process.argv.includes('--no-badge-eval')) {
            console.log('[ANTIGRAVITY] Badge evaluation triggered...');
            try {
                await evaluateBadgesForAll();
            } catch (err) {
                console.error('❌ Badge evaluation failed:', err);
                const logPath = path.join(__dirname, 'debug-reports', 'badge_eval.log');
                fs.mkdirSync(path.dirname(logPath), { recursive: true });
                fs.appendFileSync(logPath, `[${new Date().toISOString()}] Error: ${err.message}\n`);
            }
        } else {
            console.log('[ANTIGRAVITY] Skipped badge evaluation (--no-badge-eval passed).');
        }

    } catch (e) {
        console.error('❌ Import failed:', e);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
};

importBulk();
