
import { getClient } from '../db.js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import xlsx from 'xlsx';

/**
 * Parses and processes a schedule upload file.
 * Expects columns: program, semester, subject_code, date (YYYY-MM-DD), start_time (HH:MM), end_time (HH:MM), location (optional), faculty (optional)
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} - Result summary { success: boolean, count: number, errors: [] }
 */
/**
 * Helper for safe logging of rejections
 */
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

export async function processScheduleUpload(file) {
    const client = await getClient();
    const results = {
        inserted_sessions: 0,
        skipped_sessions: 0,
        reasons: {},
        errors: [] // Detailed log for transparency
    };


    try {
        const filePath = file.path;
        let records = [];

        // 1. Parse File
        const isExcel = file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel') || file.originalname.match(/\.(xlsx|xls)$/i);
        const isCsv = file.mimetype.includes('csv') || file.originalname.match(/\.csv$/i);

        try {
            if (isExcel) {
                const buf = fs.readFileSync(filePath);
                const workbook = xlsx.read(buf, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            } else {
                // Default to CSV behavior for text/csv or fallback
                const content = fs.readFileSync(filePath);
                records = parse(content, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                });
            }
        } catch (parseError) {
            throw new Error(`File Validation Failed: Unable to parse file. Ensure it is a valid CSV or Excel file. (${parseError.message})`);
        }

        // 2. Normalize Headers
        records = records.map(r => {
            const normalized = {};
            Object.keys(r).forEach(k => {
                normalized[k.toLowerCase().trim().replace(/ /g, '_')] = r[k];
            });
            return normalized;
        });

        await client.query('BEGIN');

        for (const [index, row] of records.entries()) {
            const rowIndex = index + 2; // Assuming header row is 1
            const rejectionLog = { row: rowIndex, status: 'REJECTED' };

            // 3. Normalize & Basic Validation
            let program = row.program;
            if (typeof program === 'string') program = program.trim();

            let subject_code = row.subject_code;
            if (subject_code !== undefined && subject_code !== null) {
                subject_code = String(subject_code).trim().toUpperCase();
            }

            let semester = row.semester;
            if (typeof semester === 'string') {
                const digits = semester.replace(/\D/g, '');
                semester = digits ? parseInt(digits) : NaN;
            } else if (typeof semester === 'number') {
                semester = Math.floor(semester);
            }

            // Robust Date Parsing
            let date = row.date;
            if (typeof date === 'number') {
                const d = new Date(Math.round((date - 25569) * 86400 * 1000));
                date = d.toISOString().split('T')[0];
            } else if (typeof date === 'string') {
                date = date.trim();
            }

            // Robust Time Parsing
            const normalizeTime = (t) => {
                if (typeof t === 'number') {
                    const totalSeconds = Math.round(t * 86400);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                }
                return t?.toString().trim();
            };

            const start_time = normalizeTime(row.start_time);
            const end_time = normalizeTime(row.end_time);

            if (!program || !subject_code || !semester || !date || !start_time || !end_time) {
                rejectionLog.reason = 'MISSING_FIELDS';
                rejectionLog.details = `Required: program, semester, subject_code, date, start_time, end_time. Got: ${JSON.stringify({ program, semester, subject_code })}`;
                logRejection(results, rejectionLog);
                continue;
            }

            if (isNaN(semester)) {
                rejectionLog.reason = 'INVALID_SEMESTER';
                rejectionLog.details = `Parsed semester is NaN. Original: ${row.semester}`;
                logRejection(results, rejectionLog);
                continue;
            }

            // 4. Strict Curriculum Check
            console.log(`[Validation] Checking: Program='${program}', Sem=${semester}, Code='${subject_code}'`);

            const currRes = await client.query(`
                SELECT s.subject_id 
                FROM subjects s
                JOIN curriculum c ON s.code = c.subject_code
                WHERE s.code = $1 
                AND LOWER(c.program) = LOWER($2) 
                AND c.semester = $3
                LIMIT 1
            `, [subject_code, program, semester]);

            if (currRes.rows.length === 0) {
                const progCheck = await client.query('SELECT 1 FROM curriculum WHERE LOWER(program) = LOWER($1) LIMIT 1', [program]);
                if (progCheck.rowCount === 0) {
                    rejectionLog.reason = 'PROGRAM_NOT_FOUND';
                    logRejection(results, rejectionLog);
                    continue;
                }

                const subCheck = await client.query('SELECT 1 FROM subjects WHERE code = $1 LIMIT 1', [subject_code]);
                if (subCheck.rowCount === 0) {
                    rejectionLog.reason = 'SUBJECT_CODE_NOT_FOUND_GLOBALLY';
                    rejectionLog.details = `Code '${subject_code}' not found in master subjects.`;
                    logRejection(results, rejectionLog);
                    continue;
                }

                console.warn(`[Validation Fail] Curriculum Mismatch: ${subject_code} not in ${program} Sem ${semester}`);
                rejectionLog.reason = 'CURRICULUM_MISMATCH';
                rejectionLog.details = `Subject ${subject_code} not found in ${program} Sem ${semester}. Ensure Program/Semester match exactly.`;
                logRejection(results, rejectionLog);
                continue;
            }

            const subject_id = currRes.rows[0].subject_id;
            const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Check for duplicates (same subject, date, time)
            // Note: Schema constraints might handle this, but let's be explicit
            const dupCheck = await client.query(`
                SELECT 1 FROM sessions 
                WHERE subject_id = $1 AND date = $2 AND start_time = $3
            `, [subject_id, date, start_time]);

            if (dupCheck.rowCount > 0) {
                rejectionLog.reason = 'DUPLICATE_SESSION';
                logRejection(results, rejectionLog);
                continue;
            }

            await client.query(`
                INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, location, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
            `, [sessionId, subject_id, date, start_time, end_time, row.location || 'TBA']);

            results.inserted_sessions++;
            // Optional: Log success for debug levels
            // console.log(`Row ${rowIndex} ACCEPTED: ${program} Sem ${semester} - ${subject_code}`);
        }

        await client.query('COMMIT');

        // Clean up temp file
        try { fs.unlinkSync(filePath); } catch (e) { }

        return results;

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Schedule Upload Critical Failure:", err);
        throw err; // Let route handle 500
    } finally {
        client.release();
    }
}


/**
 * Generates a pre-filled Excel template for a specific Program & Semester.
 * @param {string} program 
 * @param {number} semester 
 * @returns {Promise<Buffer>} Excel file buffer
 */
export async function generateTimetableTemplate(program, semester) {
    const client = await getClient();
    try {
        // Fetch subjects from Curriculum
        const res = await client.query(`
            SELECT subject_code, subject_name 
            FROM curriculum 
            WHERE LOWER(program) = LOWER($1) AND semester = $2
            ORDER BY subject_code
        `, [program, semester]);

        let data = [];
        if (res.rows.length > 0) {
            // Pre-fill rows for each subject to help the admin
            data = res.rows.map(s => ({
                program: program,
                semester: semester,
                subject_code: s.subject_code,
                subject_name: s.subject_name, // Helper column, ignored by parser
                date: 'YYYY-MM-DD',
                start_time: '09:00',
                end_time: '10:00',
                location: 'Room 101'
            }));
        } else {
            // Empty template if no curriculum found
            data = [{
                program: program,
                semester: semester,
                subject_code: '',
                subject_name: 'No subjects found in curriculum',
                date: 'YYYY-MM-DD',
                start_time: '09:00',
                end_time: '10:00',
                location: ''
            }];
        }

        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Timetable Template");

        return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    } finally {
        client.release();
    }
}
