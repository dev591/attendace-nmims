/* ADDED BY ANTI-GRAVITY */
// backend/import_curriculum.js
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { getClient } from './db.js'; // Use shared DB client
import { normalizeProgram, normalizeBranch } from './lib/program_branch_mapper.js';

dotenv.config();

/**
 * Imports a Curriculum/Syllabus Definition File.
 * Expected Columns: Program, Year, SubjectCode, SubjectName, TotalClasses, MandatoryPct
 */
export async function importCurriculumFile(filePath, clientParam = null) {
    let client = clientParam;
    const releaseClient = !clientParam;

    if (!client) {
        // Use shared pool instead of creating new one
        client = await getClient();
    }

    const report = {
        success: true,
        total_rows: 0,
        inserted: 0,
        errors: [],
        details: [],
        created_courses: [],
        timestamp: new Date()
    };

    try {
        console.log(`[CURRICULUM] Reading file: ${filePath}`);
        const workbook = xlsx.readFile(filePath);


        // Loop through ALL sheets (User might have data in 2nd sheet)
        for (const sheetName of workbook.SheetNames) {
            console.log(`[CURRICULUM] Processing Sheet: ${sheetName}`);
            const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

            if (rows.length === 0) {
                console.log(`[CURRICULUM] Sheet ${sheetName} is empty. Skipping.`);
                continue;
            }

            console.log(`[CURRICULUM] Found ${rows.length} rows in ${sheetName}`);
            console.log(`[CURRICULUM DEBUG] First row keys:`, Object.keys(rows[0]));

            report.total_rows += rows.length;

            // Helper to find a key
            const findKey = (row, target) => {
                const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                const targetClean = clean(target);
                for (const key of Object.keys(row)) {
                    if (clean(key) === targetClean) return row[key];
                }
                return undefined;
            };

            for (const row of rows) {
                // Fuzzy Match Keys
                const rawProgram = findKey(row, 'Program');

                // Skip row if completely empty/invalid (program is usually required)
                if (!rawProgram && !findKey(row, 'SubjectCode') && !findKey(row, 'Code')) continue;

                const rawBranch = findKey(row, 'Branch') || findKey(row, 'Stream') || findKey(row, 'Specialization');

                // NORMALIZATION
                let program = normalizeProgram(rawProgram);
                let branch = normalizeBranch(rawBranch);

                if (branch) branch = branch.toLowerCase(); // STRICT LOWERCASE

                if (program === 'engineering' && branch) {
                    program = `${program}-${branch}`;
                }

                const cleanInt = (val) => {
                    if (!val) return 1;
                    const digits = String(val).replace(/\D/g, '');
                    return digits ? parseInt(digits) : 1;
                };

                const year = cleanInt(findKey(row, 'Year'));
                const semester = cleanInt(findKey(row, 'Semester'));

                // STRICT SUBJECT CODE EXTRACTION
                const rawSubjectCode = findKey(row, 'SubjectCode') || findKey(row, 'Code') || findKey(row, 'Subject Code') || findKey(row, 'Subject_Code');
                const subjectCode = rawSubjectCode ? String(rawSubjectCode).trim() : null;

                const subjectName = findKey(row, 'SubjectName') || findKey(row, 'Subject Name') || findKey(row, 'Subject') || findKey(row, 'Name');
                const total = parseInt(findKey(row, 'TotalClasses') || findKey(row, 'Total Classes') || findKey(row, 'Total') || 40);
                const minPct = parseInt(findKey(row, 'MandatoryPct') || findKey(row, 'Mandatory') || findKey(row, 'MinPct') || 80);

                if (!program || !subjectCode) {
                    // Log detailed error but don't throw (allow skipping bad rows)
                    report.errors.push(`Row missing key data (Program/SubjectCode) in ${sheetName}: ${JSON.stringify(row)}`);
                    continue;
                }

                // 0. CLEANUP (Sync Mode) - Added by Anti-Gravity
                // We track which Program-Year-Semester groups we have cleaned to avoid wiping data repeatedly in loop
                const groupKey = `${program}|${year}|${semester}`;
                if (!report._processedGroups) report._processedGroups = new Set();

                if (!report._processedGroups.has(groupKey)) {
                    console.log(`[CURRICULUM] Syncing Group: ${groupKey} -> Cleaning old entries...`);
                    // Ensure we don't wipe data if we are processing multiple sheets of same group?
                    // Actually, if multiple sheets handle same group, we might wipe data from prev sheet!
                    // Fix: Check if groupKey was processed in THIS REQUEST, not just this sheet.
                    // Since report._processedGroups is shared across loop, it's fine.

                    await client.query(`
                        DELETE FROM curriculum 
                        WHERE LOWER(program) = $1 
                        AND year = $2 
                        AND semester = $3
                    `, [program, year, semester]);
                    report._processedGroups.add(groupKey);
                }

                // 1. Ensure Subject Exists in master subjects table
                await client.query(`
                    INSERT INTO subjects (subject_id, code, name)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
                `, [subjectCode, subjectCode, subjectName || subjectCode]);

                // 2. Insert into Curriculum (No need for upsert since we wiped)
                await client.query(`
                    INSERT INTO curriculum (program, year, semester, subject_code, subject_name, total_classes, min_attendance_pct)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (program, year, semester, subject_code) DO NOTHING
                `, [program, year, semester, subjectCode, subjectName || subjectCode, total, minPct]);

                console.log(`[CURRICULUM] Inserted subject ${subjectCode}`);
                report.inserted++;
            }
        }

        if (report.inserted === 0 && report.total_rows > 0) {
            // Collect columns from first non-empty sheet (if any found)
            report.errors.unshift(`CRITICAL: 0 rows imported. Please check if 'Subject Code' and 'Program' columns are correctly named.`);
        } else if (report.total_rows === 0) {
            report.errors.unshift(`CRITICAL: No data rows found in any sheet.`);
        } else {
            console.log(`[IMPORT API] Curriculum Import Success. Inserted: ${report.inserted}`);
        }

    } catch (err) {
        console.error("Curriculum Import Error", err);
        report.success = false;
        report.errors.push(err.message);
    } finally {
        if (releaseClient && client) client.release();
    }

    return report;
}
