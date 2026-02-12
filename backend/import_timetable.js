
import { getClient } from './db.js';
import xlsx from 'xlsx';
import { normalizeString, normalizeDate } from './lib/import_helpers.js';
import { normalizeProgram, normalizeBranch } from './lib/program_branch_mapper.js';
import { generateSessionsForRange } from './lib/scheduler_engine.js'; // Will implement next

export async function importTimetable(filePath) {
    const client = await getClient();
    const report = { inserted: 0, errors: [], scope: null };

    try {
        console.log(`[TIMETABLE IMPORT] Reading ${filePath}...`);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        // Read with header:1 to get array of arrays for A1 access
        const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        if (rawRows.length === 0) throw new Error("File is empty");

        // 1. HARDENED SCOPE PARSING (Tolerant Strategy)
        // Goal: Extract Program, Semester, Year from ANY format.
        const scopeCell = rawRows[0][0];
        console.log(`[TIMETABLE] Found Scope Header: ${scopeCell}`);

        let program = null, semester = null, year = null;
        let scopeStr = typeofOrString(scopeCell);

        // STRATEGY A: Explicit Key-Value (e.g., "Program: B.Tech | Sem: 3")
        // Not typical but safe to check.

        // STRATEGY B: Split & Search
        // Tokenize by common separators
        const tokens = scopeStr.split(/[\s|,:,-]+/).map(t => t.trim().toLowerCase());

        // 1. Find Semester
        // Look for digit following "sem", "semester", "s" or just a digit in small tokens
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (['sem', 'semester', 'term'].includes(t)) {
                // Next token might be the number
                if (i + 1 < tokens.length) {
                    const num = parseInt(tokens[i + 1]);
                    if (!isNaN(num)) semester = num;
                }
            } else if (/^sem\d+$/.test(t)) {
                semester = parseInt(t.replace('sem', ''));
            }
        }
        // Fallback: Just find the first free-standing digit < 8 if we haven't found sem yet? 
        // Risky if Program has numbers. Let's rely on "Sem" keyword validity or Row 1 fallback.

        // 2. Find Program
        if (scopeStr.toLowerCase().includes('b.tech') || scopeStr.toLowerCase().includes('tech')) program = 'B.Tech';
        else if (scopeStr.toLowerCase().includes('mba')) program = 'MBA';
        else if (scopeStr.toLowerCase().includes('pharm')) program = 'Pharmacy';

        // 3. Find School (Optional context)
        // (Not strictly used for logic yet, but good for logging)

        // STRATEGY C: Column Fallback (If Row 1 fails)
        // Check if Row 2 (Headers) or Data Rows contain "Program" or "Sem" columns?
        // Too complex for V1. Better fallback is to THROW VALIDATION ERROR if Header is total gibberish.

        if (!semester) {
            // Last resort regex for "Semester 3" or "Sem 3" or just "3" in specific positions?
            const semMatch = scopeStr.match(/(?:sem|semester)\s*[:|-]?\s*(\d+)/i);
            if (semMatch) semester = parseInt(semMatch[1]);
        }

        // Hard Defaults / cleanups
        if (program) program = normalizeProgram(program);

        // --- VALIDATION GATE ---
        const errors = [];
        if (!program) errors.push("Could not detect Program (e.g. 'B.Tech') in cell A1.");
        if (!semester) errors.push("Could not detect Semester (e.g. 'Semester 3') in cell A1.");

        if (errors.length > 0) {
            // Check if we can proceed with defaults? NO. User said "Never silently skip".
            throw new Error(`Scope Validation Failed in Cell A1: ${errors.join(' ')} Found: "${scopeCell}"`);
        }

        if (semester && !year) year = Math.ceil(semester / 2);

        console.log(`[TIMETABLE] Parsed Scope -> Program: ${program}, Year: ${year}, Sem: ${semester}`);
        report.scope = { program, year, semester };

        // 2. DYNAMIC ROW PARSING
        let headerRowIndex = -1;
        const requiredHeaders = ['day', 'start', 'subject']; // minimal match

        // Scan first 15 rows
        for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
            const rowStr = JSON.stringify(rawRows[i]).toLowerCase();
            const matchCount = requiredHeaders.filter(h => rowStr.includes(h)).length;
            if (matchCount >= 2) {
                headerRowIndex = i;
                console.log(`[TIMETABLE] Found Header Row at Index ${i}`);
                break;
            }
        }

        if (headerRowIndex === -1) throw new Error("Could not find Header Row (must contain 'Day', 'Start', 'Subject')");

        // Parse Data
        const dataRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { range: headerRowIndex });

        await client.query('BEGIN');

        // 3. CLEAR OLD DATA
        await client.query(`DELETE FROM timetable_template WHERE program = $1 AND semester = $2`, [program, semester]);

        let rowIndex = 2; // Excel Row 3 (1-header + 1-index) => but we start iteration
        for (const row of dataRows) {
            rowIndex++;
            try {
                // FLEXIBLE COLUMN MATCHING
                // Keys from xlsx are case-sensitive to the actual header in file
                const keys = Object.keys(row);
                const findKey = (candidates) => keys.find(k => candidates.some(c => k.toLowerCase().includes(c.toLowerCase())));

                const dayKey = findKey(['day']);
                const startKey = findKey(['start', 'begin']);
                const endKey = findKey(['end', 'finish']);
                const subjectKey = findKey(['subject', 'code', 'course']);
                const venueKey = findKey(['venue', 'room', 'loc']);
                const facultyKey = findKey(['faculty', 'prof', 'teacher']);

                if (!dayKey || !startKey || !subjectKey) {
                    console.warn(`[TIMETABLE] Skipping Row ${rowIndex}: Missing essential columns (Day/Time/Subject). Keys found: ${keys.join(', ')}`);
                    continue;
                }

                const day = normalizeDay(row[dayKey]);
                if (!day) continue;

                const startTime = formatTime(row[startKey]);
                const endTime = formatTime(row[endKey] || row[startKey] + 1 / 24); // Fallback end? No, tough.
                const subjectCode = normalizeString(row[subjectKey]);
                const venue = row[venueKey] || 'TBA';
                const faculty = row[facultyKey] || 'TBA';

                if (!startTime) {
                    console.warn(`[TIMETABLE] Skipping Row ${rowIndex}: Invalid Start Time.`);
                    continue;
                }

                await client.query(`
                    INSERT INTO timetable_template (
                        program, semester, year, day_of_week, 
                        start_time, end_time, subject_code, venue, faculty
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [program, semester, year, day, startTime, endTime || startTime, subjectCode, venue, faculty]);

                report.inserted++;

            } catch (err) {
                console.warn(`[TIMETABLE] Row ${rowIndex} Error: ${err.message}`);
                report.errors.push(`Row ${rowIndex}: ${err.message}`);
            }
        }

        await client.query('COMMIT');
        console.log(`[TIMETABLE] Template Import Success. Entries: ${report.inserted}`);

        // 4. TRIGGER GENERATION (Auto-generate for next 30 days)
        // We'll wrap this in try-catch so import doesn't fail if generation fails
        try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            console.log(`[TIMETABLE] Triggering Session Generation: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
            await generateSessionsForRange(client, startDate, endDate, { program, semester });
            console.log(`[TIMETABLE] Sessions Generated!`);
        } catch (genErr) {
            console.error(`[TIMETABLE] Generation Warning: ${genErr.message}`);
            report.errors.push(`Generation Failed: ${genErr.message}`);
        }

    } catch (e) {
        if (client) await client.query('ROLLBACK');
        console.error(`[TIMETABLE IMPORT] Fatal:`, e);
        report.errors.push(`FATAL: ${e.message}`);
        report.success = false;
    } finally {
        client.release();
        return report;
    }
}

// Helpers
function typeofOrString(val) {
    return (val && typeof val === 'string') ? val : String(val);
}

function normalizeDay(dayRaw) {
    if (!dayRaw) return null;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const d = String(dayRaw).trim();
    return days.find(day => day.toLowerCase() === d.toLowerCase()) || d;
}

// Handle Excel Time (fraction of day) or "09:00" string
function formatTime(val) {
    if (!val) return null;
    if (typeof val === 'number') {
        const totalSeconds = Math.round(val * 86400);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    }
    // Assume string like "09:00"
    return String(val).trim();
}
