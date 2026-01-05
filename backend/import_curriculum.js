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
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`[CURRICULUM] Found ${rows.length} rows`);
        if (rows.length > 0) {
            console.log(`[CURRICULUM DEBUG] First row keys:`, Object.keys(rows[0]));
        }
        report.total_rows = rows.length;

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
            const rawBranch = findKey(row, 'Branch') || findKey(row, 'Stream') || findKey(row, 'Specialization');

            // NORMALIZATION
            let program = normalizeProgram(rawProgram);
            let branch = normalizeBranch(rawBranch);

            if (program === 'engineering' && branch) {
                program = `${program}-${branch.toLowerCase()}`;
            }

            const cleanInt = (val) => {
                if (!val) return 1;
                const digits = String(val).replace(/\D/g, '');
                return digits ? parseInt(digits) : 1;
            };

            const year = cleanInt(findKey(row, 'Year'));
            const semester = cleanInt(findKey(row, 'Semester'));

            // STRICT SUBJECT CODE EXTRACTION
            const rawSubjectCode = findKey(row, 'SubjectCode') || findKey(row, 'Code') || findKey(row, 'Subject_Code');
            const subjectCode = rawSubjectCode ? String(rawSubjectCode).trim() : null;

            const subjectName = findKey(row, 'SubjectName') || findKey(row, 'Subject') || findKey(row, 'Name');
            const total = parseInt(findKey(row, 'TotalClasses') || findKey(row, 'Total') || 40);
            const minPct = parseInt(findKey(row, 'MandatoryPct') || findKey(row, 'Mandatory') || findKey(row, 'MinPct') || 80);

            if (!program || !subjectCode) {
                // Log detailed error but don't throw (allow skipping bad rows)
                report.errors.push(`Row missing key data (Program/SubjectCode): ${JSON.stringify(row)}`);
                continue;
            }

            // 1. Ensure Subject Exists in master subjects table
            await client.query(`
                INSERT INTO subjects (subject_id, code, name)
                VALUES ($1, $2, $3)
                ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
            `, [subjectCode, subjectCode, subjectName || subjectCode]);

            // 2. Upsert into Curriculum
            await client.query(`
                INSERT INTO curriculum (program, year, semester, subject_code, subject_name, total_classes, min_attendance_pct)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (program, year, semester, subject_code) 
                DO UPDATE SET 
                    total_classes = EXCLUDED.total_classes,
                    min_attendance_pct = EXCLUDED.min_attendance_pct;
            `, [program, year, semester, subjectCode, subjectName || subjectCode, total, minPct]);

            console.log(`[CURRICULUM] Inserted subject ${subjectCode}`);
            report.inserted++;
        }

        if (report.inserted === 0 && rows.length > 0) {
            const foundKeys = Object.keys(rows[0]).join(', ');
            report.errors.unshift(`CRITICAL: 0 rows imported. Columns found: [${foundKeys}]. Expected: [Program, Year, Semester, SubjectCode, Branch]`);
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
