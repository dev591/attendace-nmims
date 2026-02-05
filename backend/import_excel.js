/* ADDED BY ANTI-GRAVITY */
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_FILE = path.join(__dirname, 'uploads', 'import_1769153111981_Student_Master_200_Mixed.xlsx'); // Switched to Full Data
const CSV_DIR = path.join(__dirname, 'csv_templates');
const UPLOAD_BACKUP_DIR = path.join(__dirname, 'uploads', 'backup');

// Ensure backup dir
if (!fs.existsSync(UPLOAD_BACKUP_DIR)) fs.mkdirSync(UPLOAD_BACKUP_DIR, { recursive: true });

async function run() {
    console.log(`📂 Processing Excel: ${TEMPLATE_FILE}`);
    if (!fs.existsSync(TEMPLATE_FILE)) {
        console.error('Template file not found!');
        process.exit(1);
    }

    // 1. Backup
    const backupName = `backup_${Date.now()}_full_import.xlsx`;
    fs.copyFileSync(TEMPLATE_FILE, path.join(UPLOAD_BACKUP_DIR, backupName));

    // 2. Read & Convert
    const wb = XLSX.readFile(TEMPLATE_FILE);

    // Helper: Sheet to CSV
    const processSheet = async (sheetName, targetCsv, transformFn) => {
        // Fallback for different sheet names in various templates
        let sheet = wb.Sheets[sheetName];
        if (!sheet) {
            // Try case-insensitive lookup
            const found = wb.SheetNames.find(n => n.toLowerCase() === sheetName.toLowerCase());
            if (found) sheet = wb.Sheets[found];
        }

        if (!sheet) {
            console.warn(`Sheet ${sheetName} missing. Skipping.`);
            return;
        }
        const json = XLSX.utils.sheet_to_json(sheet);

        // Transform Logic
        const newJson = [];
        for (let row of json) {
            if (transformFn) await transformFn(row);
            // Ensure Clean headers mapping if needed, simplified here
            newJson.push(row);
        }

        // Write to CSV
        if (newJson.length > 0) {
            const csv = stringify(newJson, { header: true });
            fs.writeFileSync(path.join(CSV_DIR, targetCsv), csv);
            console.log(`   -> Converted ${sheetName} to ${targetCsv} (${newJson.length} rows)`);
        }
    };

    // Process Students: Hash passwords
    let studentSheet = 'Students';
    if (!wb.Sheets['Students']) {
        console.warn("⚠️ 'Students' sheet missing. Using first sheet as fallback: " + wb.SheetNames[0]);
        studentSheet = wb.SheetNames[0];
    }

    await processSheet(studentSheet, 'students.csv', async (row) => {
        // --- 1. Map Columns from Raw Excel Headers ---
        if (row['SAP ID']) row.sapid = row['SAP ID'];
        if (row['Student Name']) row.name = row['Student Name'];
        if (row['Branch']) row.dept = row['Branch'];
        if (row['Program']) row.program = row['Program'];
        if (row['Year']) row.year = row['Year'];
        if (row['Semester']) row.semester = row['Semester'];

        // Generate valid student_id
        if (!row.student_id && row.sapid) {
            row.student_id = "ST_" + row.sapid;
        }

        // --- 2. Generate Course Link ---
        // Logic: C_{Dept}_{Semester} e.g. C_CSE_SEM4
        // Ensure semester is present for link
        if (!row.course_id && row.dept && row.semester) {
            // Clean dept (CSE -> CS if needed, but let's stick to Excel value for now)
            const cleanDept = row.dept.toUpperCase().replace('.', '');
            const cleanSem = row.semester;
            row.course_id = `C_${cleanDept}_SEM${cleanSem}`;
        }

        // --- 3. Default Email ---
        if (!row.email && row.sapid) {
            row.email = `${row.sapid}@nmims.edu`;
        }

        // --- 4. Password Fix ---
        if (!row.password_hash) {
            const salt = await bcrypt.genSalt(10);
            // Set default to '123456' for everyone as requested
            row.password_hash = await bcrypt.hash("123456", salt);
        }
        delete row.password_plain;
    });

    await processSheet('Subjects', 'subjects.csv');
    await processSheet('Sessions', 'sessions.csv');
    await processSheet('Attendance', 'attendance.csv');

    // 3. Trigger Bulk Import
    console.log('🚀 Triggering import_bulk.js...');
    try {
        execSync('node import_bulk.js', { cwd: __dirname, stdio: 'inherit' });
        console.log('✅ Excel Import sequence complete.');
    } catch (e) {
        console.error('❌ import_bulk.js failed.');
        process.exit(1);
    }
}

run();
