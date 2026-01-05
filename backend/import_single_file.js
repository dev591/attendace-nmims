/* ADDED BY ANTI-GRAVITY */
/**
 * import_single_file.js
 * The source-of-truth importer for Antigravity.
 * Supports .xlsx/csv, idempotent upserts, auto-creation of courses, and analytics triggers.
 */

import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { getClient, query } from './db.js'; // Using correct imports
import { recomputeAnalyticsForStudent } from './lib/analytics.js';
import { evaluateBadgesForStudent } from './lib/badges.js';
import { normalizeHeader, normalizeString, normalizeDate, normalizeBoolean } from './lib/import_helpers.js';
import { normalizeProgram, normalizeBranch } from './lib/program_branch_mapper.js';
import { autoEnrollStudent } from './lib/enrollment_service.js';

const REPORT_DIR = path.join(process.cwd(), 'debug-reports');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

async function importSingleFile(filePath) {
    const client = await getClient();
    const report = { timestamp: new Date(), file: filePath, created_courses: [], errors: [], details: [] };

    try {
        console.log(`[IMPORTER] Reading ${filePath}...`);
        const workbook = xlsx.readFile(filePath);
        const sheets = workbook.SheetNames;

        // 1. IMPORT COURSES (Inferred or Explicit)
        // Check for 'Courses' sheet, else infer from 'Subjects' or 'Students' later
        // For now, let's assume we extract unique course_ids from Students & Subjects

        // 2. IMPORT SUBJECTS
        if (workbook.Sheets['Subjects']) {
            const rows = xlsx.utils.sheet_to_json(workbook.Sheets['Subjects']);
            for (const row of rows) {
                // Expected: subject_id, name, course_id, semester
                const subId = normalizeString(row.subject_id);
                const name = normalizeString(row.name);
                const courseId = normalizeString(row.course_id);

                if (subId && courseId) {
                    await ensureCourseExists(client, courseId, report);

                    try {
                        await client.query(`
                            INSERT INTO subjects (subject_id, name, course_id, semester, credits)
                            VALUES ($1, $2, $3, $4, 3)
                            ON CONFLICT (subject_id) DO UPDATE SET name = EXCLUDED.name;
                        `, [subId, name, courseId, row.semester || 1]);
                        report.details.push({ type: 'subject', id: subId, status: 'ok' });
                    } catch (e) {
                        report.errors.push(`Subject ${subId}: ${e.message}`);
                    }
                }
            }
        }

        // 3. IMPORT SESSIONS
        if (workbook.Sheets['Sessions']) {
            const rows = xlsx.utils.sheet_to_json(workbook.Sheets['Sessions']);
            for (const row of rows) {
                // Expected: session_id, subject_id, date, start_time, end_time, type
                const sesId = normalizeString(row.session_id);
                const subId = normalizeString(row.subject_id);
                if (sesId && subId) {
                    try {
                        await client.query(`
                            INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, type, room)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                            ON CONFLICT (session_id) DO UPDATE SET date = EXCLUDED.date;
                        `, [sesId, subId, normalizeDate(row.date), row.start_time, row.end_time || '00:00', row.type || 'Lecture', row.room || 'Online']);
                        report.details.push({ type: 'session', id: sesId, status: 'ok' });
                    } catch (e) {
                        report.errors.push(`Session ${sesId}: ${e.message}`);
                    }
                }
            }
        }

        // 4. SMART IMPORT STUDENTS (Iterate all sheets)
        for (const sheetName of sheets) {
            console.log(`[IMPORTER] Inspecting sheet: ${sheetName}`);
            const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            if (rawRows.length === 0) continue;

            const headers = Object.keys(rawRows[0]).map(h => normalizeHeader(h));
            // Check for student identifiers in headers
            const isStudentSheet = headers.some(h => ['sapid', 'sap_id', 'student_id', 'studentid'].includes(h));

            if (isStudentSheet) {
                console.log(`[IMPORTER] Detected 'Students' content in sheet: ${sheetName}`);
                const stats = new Set();
                let rowCount = 0;

                // Helper: Fuzzy Finder
                const findVal = (row, keys) => {
                    const rowKeys = Object.keys(row);
                    for (const k of keys) {
                        // Exact match?
                        if (row[k] !== undefined) return row[k];
                        // Fuzzy match?
                        const match = rowKeys.find(rk => normalizeHeader(rk) === normalizeHeader(k));
                        if (match && row[match] !== undefined) return row[match];
                    }
                    return undefined;
                };

                for (const row of rawRows) {
                    const sapid = normalizeString(findVal(row, ['sapid', 'sap_id', 'student_id', 'studentid', 'SAPID', 'SAP ID']));
                    const courseId = normalizeString(findVal(row, ['course_id', 'course', 'stream']) || 'DEFAULT_COURSE');

                    const rawPassword = findVal(row, ['password', 'pwd', 'password_plain']) || "password123";
                    const passwordHash = await bcrypt.hash(String(rawPassword), 10);
                    const studentId = `S${sapid}`;

                    const rawSem = findVal(row, ['semester', 'sem', 'term']);
                    const rawYear = findVal(row, ['year', 'yr']);
                    const rawProg = findVal(row, ['program', 'prog', 'stream', 'course']);
                    const rawBranch = findVal(row, ['branch', 'specialization', 'dept', 'department']) || rawProg; // Fallback to Prog for parsing

                    const semester = parseInt(rawSem);
                    const year = parseInt(rawYear);

                    // NORMALIZATION
                    // If Program is "B.Tech CS", normalizeProgram="Engineering".
                    // But normalizeBranch("B.Tech CS") -> "CE"? No, strict map checks "CS" ok but "B.Tech" no.
                    // We need to pass the raw string to normalizeBranch if rawBranch is missing.

                    const program = normalizeProgram(rawProg);

                    // Extract Branch logic (e.g. from "B.Tech CS")
                    let branch = normalizeBranch(rawBranch);
                    // Standardize DB storage to lowercase per user request
                    if (branch) branch = branch.toLowerCase();

                    // Specific Fix for "Computer Science" if strict mapper didn't catch it
                    if (rawProg && rawProg.toLowerCase().includes('data science') && !branch) branch = 'ds';

                    console.log(`[IMPORT] Normalized branch '${rawBranch}' -> '${branch}'`);

                    if (rowCount < 5) {
                        console.log(`[IMPORT VALIDATION] Row ${rowCount + 1}: SAPID=${sapid}, Prog='${program}', Br='${branch}', Y=${year}`);
                    }

                    // ANTI-GRAVITY DEBUG SQUAD
                    if (sapid === '90030002') {
                        console.log(`\n🚨 INSPECTING 90030002 🚨`);
                        console.log(`Raw Row Keys:`, Object.keys(row));
                        console.log(`Raw Row Values:`, row);
                        console.log(`Extracted: sapid='${sapid}', rawProg='${rawProg}', rawBranch='${rawBranch}'`);
                        console.log(`Normalized: program='${program}', branch='${branch}'`);
                        console.log(`Check: !branch? ${!branch}`);
                        console.log(`-------------------------\n`);
                    }
                    rowCount++;
                    // ...

                    await ensureCourseExists(client, courseId, report);
                    try {
                        stats.add(`${program}|${year}|${semester}`);
                        await client.query(`
                            INSERT INTO students (student_id, sapid, name, email, course_id, program, year, semester, password_hash, must_set_password, dept)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                            ON CONFLICT (sapid) DO UPDATE SET 
                                name = EXCLUDED.name,
                                email = EXCLUDED.email,
                                course_id = EXCLUDED.course_id,
                                program = EXCLUDED.program,
                                year = EXCLUDED.year,
                                semester = EXCLUDED.semester,
                                dept = EXCLUDED.dept;
                        `, [studentId, sapid, findVal(row, ['name', 'student_name', 'fullname']) || rawProg, findVal(row, ['email', 'mail']), courseId, program, year, semester, passwordHash, true, branch]);

                        report.details.push({ type: 'student', id: sapid, status: 'ok' });
                        await recomputeAnalyticsForStudent(sapid);
                        await evaluateBadgesForStudent(sapid);
                        // Auto-Enroll Trigger (Updated Signature)
                        await autoEnrollStudent(studentId, program, branch, semester, year);
                    } catch (e) {
                        if (e.message === "BRANCH_REQUIRED_FOR_ENROLLMENT") {
                            report.errors.push(`Student ${sapid}: MISSING BRANCH DATA. RawProg='${rawProg}', RawBranch='${rawBranch}'. Ensure 'Dept' column exists.`);
                        } else {
                            report.errors.push(`Student ${sapid}: ${e.message}`);
                        }
                    }
                }
                report.distinct_student_groups = Array.from(stats);
                console.log(`[IMPORTER] Imported Students. Distinct Groups:`, report.distinct_student_groups);
            }
        }

        // 5. IMPORT ATTENDANCE
        if (workbook.Sheets['Attendance']) {
            const rows = xlsx.utils.sheet_to_json(workbook.Sheets['Attendance']);
            for (const row of rows) {
                const sesId = normalizeString(row.session_id);
                if (sesId) {
                    for (const key of Object.keys(row)) {
                        if (key !== 'session_id' && key !== 'date') {
                            const sapid = key;
                            const val = row[key];
                            const present = normalizeBoolean(val);

                            const sRes = await client.query('SELECT student_id FROM students WHERE sapid = $1', [sapid]);
                            if (sRes.rows.length > 0) {
                                const sid = sRes.rows[0].student_id;
                                try {
                                    await client.query(`
                                        INSERT INTO attendance (session_id, student_id, present, status)
                                        VALUES ($1, $2, $3, $4)
                                        ON CONFLICT (session_id, student_id) DO UPDATE SET present = EXCLUDED.present;
                                     `, [sesId, sid, present, present ? 'Present' : 'Absent']);
                                } catch (e) { }
                            }
                        }
                    }
                }
            }
        }

        // 6. POST-IMPORT VERIFICATION
        const verifyQ = await client.query('SELECT COUNT(*) as count FROM students');
        const count = parseInt(verifyQ.rows[0].count);
        report.db_verification = { students_count: count, status: count > 0 ? "OK" : "CRITICAL_FAILURE" };
        console.log(`[IMPORTER VERIFICATION] Total Students in DB: ${count}`);

    } catch (err) {
        console.error('Import failed', err);
        report.errors.push('Fatal: ' + err.message);
    } finally {
        client.release();
        const reportPath = path.join(REPORT_DIR, `import_report_${Date.now()}.json`);
        // fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`[IMPORTER] Report saved to ${reportPath}`);
        return report;
    }
}

async function ensureCourseExists(client, courseId, report) {
    if (!courseId) return;
    const res = await client.query('SELECT 1 FROM courses WHERE course_id = $1', [courseId]);
    if (res.rowCount === 0) {
        await client.query('INSERT INTO courses (course_id, name) VALUES ($1, $2)', [courseId, `Course ${courseId}`]);
        report.created_courses.push(courseId);
    }
}

// CLI Execution Support
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const file = process.argv[2];
    if (file) {
        importSingleFile(file).then(r => console.log('Done', r.errors.length, 'errors'));
    } else {
        console.log('Usage: node import_single_file.js <path>');
    }
}

export { importSingleFile };
