
import { getClient } from '../db.js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import xlsx from 'xlsx';

/**
 * GOD-LEVEL SCHEDULE UPLOADER
 * Rules:
 * 1. Inputs: Weekly Timetable (Day, Time, Subject, etc.)
 * 2. Output: Generated Sessions from Jan 02 2026 to May 31 2026
 * 3. Scoping: Program, Branch, Semester, Section strict matching.
 * 4. Weighting: LAB = 2 classes, THEORY = 1.
 */

const SEMESTER_START = '2026-01-02';
const SEMESTER_END = '2026-05-31';

const logRejection = (resObject, logEntry) => {
    try {
        resObject.skipped_sessions++;
        const reason = logEntry.reason || 'UNKNOWN_ERROR';
        resObject.reasons[reason] = (resObject.reasons[reason] || 0) + 1;
        resObject.errors.push(logEntry);
    } catch (e) {
        console.error("Safe Logger Failed:", e);
    }
};

export async function processScheduleUpload(file, ignoredScope = {}) {
    const client = await getClient();
    const results = {
        inserted_sessions: 0,
        skipped_sessions: 0,
        reasons: {},
        errors: []
    };

    try {
        await client.query('BEGIN');

        // 1. Parse File 
        const filePath = file.path;
        let workbook;
        let isExcel = file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel') || file.originalname.match(/\.(xlsx|xls)$/i);

        if (isExcel) {
            const buf = fs.readFileSync(filePath);
            workbook = xlsx.read(buf, { type: 'buffer' });
        }

        // PRE-FETCH Subject Map (Once for all sheets)
        const subRes = await client.query('SELECT code, subject_id FROM subjects');
        const subjectMap = new Map();
        subRes.rows.forEach(s => subjectMap.set(s.code.toUpperCase(), s.subject_id));

        // Generate Date Range (Once)
        const dateMap = new Map();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (let d = new Date(SEMESTER_START); d <= new Date(SEMESTER_END); d.setDate(d.getDate() + 1)) {
            const dayName = days[d.getDay()];
            if (!dateMap.has(dayName.toLowerCase())) dateMap.set(dayName.toLowerCase(), []);
            dateMap.get(dayName.toLowerCase()).push(d.toISOString().split('T')[0]);
        }

        const sheets = workbook ? workbook.SheetNames : ['CSV_DATA'];

        for (const sheetName of sheets) {
            console.log(`[Schedule] Scanning Sheet: ${sheetName}`);

            let records = [];
            if (workbook) {
                records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            } else {
                // CSV Fallback
                const content = fs.readFileSync(filePath);
                records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
            }

            if (records.length === 0) continue;

            // 2. Normalize Headers
            records = records.map(r => {
                const normalized = {};
                Object.keys(r).forEach(k => {
                    const cleanKey = k.toLowerCase().trim().replace(/ /g, '_');
                    normalized[cleanKey] = r[k];
                });
                return normalized;
            });

            // 3. EXTRACT SCOPE FROM ROW 1 (AUTO-INFERENCE)
            const firstRow = records[0];

            // Allow Header Hunting? (MVP: Stick to Row 1 for Timetable, it's usually cleaner)
            // If Row 1 is garbage, try Row 2?
            // Let's assume Row 1 for now to avoid complexity, usually Timetables are strict.

            const SCHOOL_MAP = {
                "mba": "MBA", "pharma": "PHARMA", "law": "LAW",
                "btech": "STME", "engineering": "STME", "mpstme": "STME", "b.tech": "STME"
            };

            let school = firstRow.school || firstRow.school_name || firstRow.institute;
            const program = firstRow.program || firstRow.course;
            let section = firstRow.section || firstRow.division || null;
            let semester = firstRow.semester || firstRow.sem || firstRow.term;

            // INFERENCE: SCHOOL
            if (!school && program) {
                const progKey = program.toLowerCase().replace(/[^a-z]/g, '');
                for (const [key, val] of Object.entries(SCHOOL_MAP)) {
                    if (progKey.includes(key)) {
                        school = val;
                        break;
                    }
                }
            }

            // VALIDATION: Skip invalid sheets instead of failing hard?
            // If a sheet lacks Program/Sem/Subject, it might be a "Legend" sheet.
            if (!program || !semester) {
                console.warn(`[Schedule] Skipping sheet '${sheetName}': Missing Program/Semester in Row 1.`);
                continue;
            }

            if (!school) school = 'STME';

            // Normalize Semester
            if (typeof semester === 'string') {
                const digits = semester.replace(/\D/g, '');
                semester = digits ? parseInt(digits) : NaN;
            }

            console.log(`[Schedule] Processing Scope for '${sheetName}': ${school} | ${program} | Sem ${semester}`);

            // 4. CLEANUP OLD SESSIONS for this Scope
            await client.query(`
                DELETE FROM sessions 
                WHERE school = $1 
                AND program = $2
                AND semester = $3
                AND section IS NOT DISTINCT FROM $4
                AND date > CURRENT_DATE
            `, [school, program, semester, section]);

            // 5. PROCESS ROWS
            for (const [index, row] of records.entries()) {
                const rowIndex = index + 2;
                const rejectionLog = { sheet: sheetName, row: rowIndex, status: 'REJECTED' };

                if (!row.subject_code || !row.start_time || !row.end_time) {
                    rejectionLog.reason = 'MISSING_CORE_FIELDS';
                    logRejection(results, rejectionLog);
                    continue;
                }

                if (!row.day && !row.date) {
                    rejectionLog.reason = 'MISSING_TIMING';
                    logRejection(results, rejectionLog);
                    continue;
                }

                const subjectCode = row.subject_code.trim().toUpperCase();
                let subjectId = null;

                if (!subjectMap.has(subjectCode)) {
                    // AUTO-CREATE SUBJECT
                    try {
                        const name = row.subject_name || `Subject ${subjectCode}`;
                        await client.query(`
                            INSERT INTO subjects (subject_id, code, name)
                            VALUES ($1, $2, $3)
                            ON CONFLICT (code) DO NOTHING
                        `, [subjectCode, subjectCode, name]);
                        subjectMap.set(subjectCode, subjectCode);
                        subjectId = subjectCode;
                    } catch (e) {
                        rejectionLog.reason = 'SUBJECT_CREATION_FAILED';
                        logRejection(results, rejectionLog);
                        continue;
                    }
                } else {
                    subjectId = subjectMap.get(subjectCode);
                }

                // DATES
                let targetDates = [];
                if (row.date) {
                    let dStr = row.date;
                    if (!isNaN(Date.parse(dStr))) {
                        targetDates = [new Date(dStr).toISOString().split('T')[0]];
                    } else {
                        rejectionLog.reason = 'INVALID_DATE';
                        logRejection(results, rejectionLog);
                        continue;
                    }
                } else {
                    const dayName = (row.day || '').trim().toLowerCase();
                    targetDates = dateMap.get(dayName);
                    if (!targetDates || targetDates.length === 0) {
                        rejectionLog.reason = 'INVALID_DAY';
                        logRejection(results, rejectionLog);
                        continue;
                    }
                }

                const normalizedType = (row.session_type || 'Lecture').toUpperCase();
                const conductedCount = (normalizedType.includes('LAB')) ? 2 : 1;
                let counts = true;
                if (row.counts_for_attendance !== undefined) {
                    const val = String(row.counts_for_attendance).toLowerCase();
                    counts = (val === 'true' || val === 'yes' || val === '1');
                }

                for (const date of targetDates) {
                    // Unique ID
                    const rawId = `${subjectCode}_${date}_${row.start_time.replace(/[:\s]/g, '')}_${section || 'ALL'}`;
                    const sessionId = `sess_${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

                    let status = 'scheduled';
                    if (date < new Date().toISOString().split('T')[0]) status = 'conducted';

                    await client.query(`
                        INSERT INTO sessions (
                            session_id, subject_id, date, start_time, end_time, location, 
                            status, type, session_type, counts_for_attendance, conducted_count,
                            school, program, semester, branch, section
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6,
                            $7, $8, $8, $9, $10,
                            $11, $12, $13, $14, $15
                        )
                        ON CONFLICT (session_id) DO UPDATE SET
                            location = EXCLUDED.location,
                            start_time = EXCLUDED.start_time,
                            end_time = EXCLUDED.end_time;
                    `, [
                        sessionId, subjectId, date,
                        row.start_time, row.end_time, row.location,
                        status, normalizedType, counts, conductedCount,
                        school, program, semester, null, section
                    ]);
                    results.inserted_sessions++;
                }
            }
        }

        await client.query('COMMIT');
        try { fs.unlinkSync(filePath); } catch (e) { }
        return results;

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Schedule Generation Failure:", err);
        throw err;
    } finally {
        client.release();
    }
}

/**
         * Generates what the Admin UI calls "Official Template"
         * returns a buffer (Excel file)
         */
export async function generateTimetableTemplate(program, semester) {
    const client = await getClient();
    try {
        // 1. Get Subjects for this specific Program + Sem
        // Note: Curriculum table must be accurate
        const res = await client.query(`
            SELECT subject_name, code, credits 
            FROM curriculum 
            WHERE program = $1 
            AND semester = $2
            ORDER BY subject_name
        `, [program, semester]);

        // Default subjects if none found (fallback)
        let subjects = res.rows;
        if (subjects.length === 0) {
            subjects = [
                { code: 'CS101', subject_name: 'Example Subject 1' },
                { code: 'CS102', subject_name: 'Example Subject 2' },
            ];
        }

        // 2. Create Header Row (God Level Specs)
        const headers = [
            'School', 'Program', 'Year', 'Semester', 'Section',
            'Day', 'Start Time', 'End Time',
            'Subject Code', 'Session Type', 'Venue'
        ];

        // 3. Create Sample Rows
        // Just fill one row as example
        const sampleRow = {
            'School': 'MPSTME',
            'Program': program || 'B.Tech',
            'Year': Math.ceil((semester || 1) / 2),
            'Semester': semester || 1,
            'Section': 'A',
            'Day': 'Monday',
            'Start Time': '09:00',
            'End Time': '10:00',
            'Subject Code': subjects[0]?.code || 'SUB123',
            'Session Type': 'THEORY', // or LAB
            'Venue': 'CR-501'
        };

        // 4. Build Sheet
        const ws = xlsx.utils.json_to_sheet([sampleRow], { header: headers });
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Timetable_Template");

        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    } finally {
        client.release();
    }
}

