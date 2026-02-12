
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
            // 1. ROBUST RAW READ (Array of Arrays)
            let rawRows = [];
            if (workbook) {
                rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
            } else {
                // CSV Fallback - parse as arrays
                const content = fs.readFileSync(filePath);
                // For CSV, we might not have A1 scope. Assume standard headers.
                const csvRecords = parse(content, { columns: true, skip_empty_lines: true, trim: true });
                // Convert to normalized structure immediately? 
                // Let's stick to the robust path for Excel. For CSV, use old logic logic shim.
                rawRows = [Object.keys(csvRecords[0] || {}), ...csvRecords.map(Object.values)];
            }

            if (rawRows.length === 0) continue;

            // 2. PARSE SCOPE FROM A1 (Accepts "Scope: X | Y" or "X, Y")
            const scopeCell = rawRows[0][0];
            let program = null, semester = null, school = null, section = null;

            // KNOWN SCHOOLS
            const KNOWN_SCHOOLS = ['STME', 'SPTM', 'SOL', 'SBM', 'SAMSOE', 'SDSOS', 'KPMSOL', 'SOD', 'SOS'];

            // Try to Parse A1
            if (scopeCell && typeof scopeCell === 'string') {
                const s = scopeCell.toUpperCase(); // Uppercase for School matching
                const tokens = s.replace('SCOPE:', '').split(/[\s|,:,-]+/).map(t => t.trim());

                // 1. Find School (First token or match)
                for (const t of tokens) {
                    if (KNOWN_SCHOOLS.includes(t)) {
                        school = t;
                        break;
                    }
                }

                const sLow = scopeCell.toLowerCase(); // Use original scopeCell for lowercase matching
                // 2. Find Semester
                const tokensLow = sLow.replace('scope:', '').split(/[\s|,:,-]+/).map(t => t.trim());
                for (let i = 0; i < tokensLow.length; i++) {
                    if (['sem', 'semester'].includes(tokensLow[i]) && tokensLow[i + 1]) {
                        semester = parseInt(tokensLow[i + 1]);
                    } else if (/^sem\d+$/.test(tokensLow[i])) {
                        semester = parseInt(tokensLow[i].replace('sem', ''));
                    }
                }

                // 3. Find Program
                if (sLow.includes('b.tech') || sLow.includes('tech')) program = 'B.Tech';
                else if (sLow.includes('mba')) program = 'MBA';
                else if (sLow.includes('m.tech')) program = 'M.Tech';
                else if (sLow.includes('pharm')) program = 'Pharmacy';
                else if (sLow.includes('law')) program = 'Law';

                // 4. Find Section
                const secMatch = sLow.match(/section\s*([a-z])/i);
                if (secMatch) section = secMatch[1].toUpperCase();
            }

            // Fallback: If not found in A1, look at ignoredScope (passed from admin override?)
            if (ignoredScope && ignoredScope.program) program = ignoredScope.program;
            if (ignoredScope.semester) semester = ignoredScope.semester;

            // 3. FIND HEADER ROW & EXTRACT DATA
            let headerIndex = -1;
            const knownHeaders = ['subject', 'code', 'start', 'time', 'day', 'date'];

            for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
                const rowStr = JSON.stringify(rawRows[i]).toLowerCase();
                const hits = knownHeaders.filter(h => rowStr.includes(h)).length;
                if (hits >= 2) {
                    headerIndex = i;
                    console.log(`[Schedule] Found Header Row at Index ${i}`);
                    break;
                }
            }

            if (headerIndex === -1) {
                console.warn(`[Schedule] Skipping '${sheetName}': No valid header row found.`);
                continue;
            }

            // Normalization Helpers
            const normalizeKey = (k) => (k || '').toString().toLowerCase().trim().replace(/ /g, '_');

            const headerRow = rawRows[headerIndex].map(normalizeKey);

            // Build Records
            records = rawRows.slice(headerIndex + 1).map(row => {
                const obj = {};
                headerRow.forEach((key, idx) => {
                    if (key) obj[key] = row[idx];
                });
                return obj;
            });

            // 4. FINAL SCOPE VALIDATION
            // Default program if not found
            if (!program) program = 'B.Tech';
            if (!semester) {
                // Try searching in first data row?
                if (records[0] && (records[0].semester || records[0].sem)) {
                    semester = parseInt(records[0].semester || records[0].sem);
                }
            }

            // STRICT VALIDATION: School Must Be Present
            if (!school) {
                // Last ditch: check ignoreScope or file name?
                // For now, reject as per requirement.
                console.warn(`[Schedule] Skipping sheet '${sheetName}': Missing SCHOOL in Scope (e.g. 'Scope: STME | ...').`);
                continue;
            }

            if (!program || !semester) {
                console.warn(`[Schedule] Skipping sheet '${sheetName}': Validation Failed.`);
                console.warn(`[Schedule] Raw A1: "${scopeCell}"`);
                console.warn(`[Schedule] Parsed -> School: ${school}, Program: ${program}, Sem: ${semester}`);
                console.warn(`[Schedule] Missing: ${!program ? 'PROGRAM' : ''} ${!semester ? 'SEMESTER' : ''}`);

                // Throwing error for visibility in response?
                // The user needs to see this reason.
                if (!program) throw new Error(`Scope Error: Could not detect PROGRAM in cell A1. Found: "${scopeCell}"`);
                if (!semester) throw new Error(`Scope Error: Could not detect SEMESTER in cell A1. Found: "${scopeCell}"`);

                continue;
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

                // ROW-LEVEL SCHOOL OVERRIDE (If Excel has "School" column)
                // The user explicitly requested mapping Excel "School" column -> DB school field.
                let effectiveSchool = row.school || school;
                // Normalize if needed, or trust input? Let's trust input but uppercase.
                if (effectiveSchool) effectiveSchool = effectiveSchool.toUpperCase();

                if (!subjectMap.has(subjectCode)) {
                    // AUTO-CREATE SUBJECT
                    try {
                        const name = row.subject_name || `Subject ${subjectCode}`;
                        await client.query(`
                            INSERT INTO subjects (subject_id, code, name, school)
                            VALUES ($1, $2, $3, $4)
                            ON CONFLICT (code) DO NOTHING
                        `, [subjectCode, subjectCode, name, effectiveSchool]);
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
                        effectiveSchool, program, semester, null, section
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

