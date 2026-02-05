
import { getClient } from './db.js';
import xlsx from 'xlsx';
import { normalizeHeader, normalizeString, normalizeDate } from './lib/import_helpers.js';
import { normalizeProgram, normalizeBranch } from './lib/program_branch_mapper.js';

export async function importTimetable(filePath) {
    const client = await getClient();
    const report = { inserted: 0, errors: [] };

    try {
        console.log(`[TIMETABLE IMPORT] Reading ${filePath}...`);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (rows.length === 0) {
            throw new Error("File is empty");
        }

        console.log(`[TIMETABLE IMPORT] Found ${rows.length} rows.`);

        await client.query('BEGIN');

        let rowIndex = 0;
        for (const row of rows) {
            rowIndex++;
            try {
                // 1. EXTRACT & NORMALIZE
                const rawProg = row['program'] || row['Program'];
                const rawBranch = row['branch'] || row['Branch']; // Timetable MUST have branch
                const rawSem = row['semester'] || row['Semester'] || row['sem'];
                const rawYear = row['year'] || row['Year'];

                const subjectCode = normalizeString(row['subject_code'] || row['Subject Code'] || row['Code']);
                // Use subject name from DB ideally, but user might provide it.
                // const subjectName = normalizeString(row['subject_name'] || row['Subject Name']); 

                const dateStr = normalizeDate(row['date'] || row['Date']);
                const startTime = row['start_time'] || row['Start Time'];
                const endTime = row['end_time'] || row['End Time'];
                const room = row['location'] || row['Location'] || 'Online';
                const type = row['type'] || row['Type'] || 'Lecture';

                // 2. VALIDATION: MANDATORY FIELDS
                if (!rawProg || !rawBranch || !subjectCode || !dateStr || !startTime || !endTime) {
                    throw new Error("Missing required fields (Program, Branch, Subject Code, Date, Time)");
                }

                // 3. NORMALIZE KEYS
                const prog = normalizeProgram(rawProg);
                const br = normalizeBranch(rawBranch).toLowerCase(); // Strict lowercase
                const year = parseInt(rawYear);
                const sem = parseInt(rawSem);

                if (!prog || !br || isNaN(year) || isNaN(sem)) {
                    throw new Error(`Invalid Program/Branch/Year/Sem: ${rawProg} / ${rawBranch}`);
                }

                // 4. VALIDATE AGAINST CURRICULUM (Strict Timetable Rule)
                // The subject MUST exist in the curriculum for this program/branch

                // Construct KEYS
                const strictKey = `${prog}-${br}`; // e.g. engineering-ds
                const commonKey = prog;            // e.g. engineering

                // Try Strict First
                let currCheck = await client.query(`
                    SELECT 1 FROM curriculum 
                    WHERE program = $1 
                      AND year = $2 
                      AND semester = $3 
                      AND subject_code = $4
                `, [strictKey, year, sem, subjectCode]);

                if (currCheck.rowCount === 0) {
                    // Try Common Fallback (e.g. for Engineering 1st Year)
                    const commonCheck = await client.query(`
                        SELECT 1 FROM curriculum 
                        WHERE program = $1 
                        AND year = $2 
                        AND semester = $3 
                        AND subject_code = $4
                    `, [commonKey, year, sem, subjectCode]);

                    if (commonCheck.rowCount > 0) {
                        // Found in common!
                        // console.log(`[TIMETABLE] Subject '${subjectCode}' found in Common Curriculum (${commonKey}).`);
                    } else {
                        throw new Error(`Subject '${subjectCode}' is NOT in curriculum for ${strictKey} OR ${commonKey} Y${year}S${sem}. Add to curriculum first.`);
                    }
                }

                // 5. INSERT CLASS SESSION
                // session_id format: date_start_subject (e.g., 2025-10-10_10:00_DS101)
                const sessionId = `${dateStr}_${startTime.replace(/:/g, '')}_${subjectCode}`;

                await client.query(`
                    INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, type, room)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (session_id) DO UPDATE SET
                        room = EXCLUDED.room,
                        type = EXCLUDED.type,
                        end_time = EXCLUDED.end_time
                `, [sessionId, subjectCode, dateStr, startTime, endTime, type, room]);

                report.inserted++;

            } catch (err) {
                console.warn(`[TIMETABLE IMPORT] Row ${rowIndex} Error: ${err.message}`);
                report.errors.push(`Row ${rowIndex} (${row['subject_code'] || 'Unknown'}): ${err.message}`);
            }
        }

        if (report.inserted > 0) {
            await client.query('COMMIT');
            console.log(`[TIMETABLE IMPORT] Success. Inserted/Updated: ${report.inserted}`);
        } else {
            await client.query('ROLLBACK'); // If nothing valid, don't partial commit? Or allow partial?
            // Let's allow partial if just some errors, but if 0 inserted, rollback is effectively same.
            console.log(`[TIMETABLE IMPORT] Finished with 0 insertions.`);
        }

    } catch (e) {
        if (client) await client.query('ROLLBACK');
        console.error(`[TIMETABLE IMPORT] Fatal Error:`, e);
        report.errors.push(`FATAL: ${e.message}`);
    } finally {
        client.release();
        return report;
    }
}
