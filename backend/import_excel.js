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
const TEMPLATE_FILE = path.join(__dirname, 'uploads', 'college_single_import_template.xlsx');
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
    const backupName = `backup_${Date.now()}_college_single_import_template.xlsx`;
    fs.copyFileSync(TEMPLATE_FILE, path.join(UPLOAD_BACKUP_DIR, backupName));

    // 2. Read & Convert
    const wb = XLSX.readFile(TEMPLATE_FILE);

    // Helper: Sheet to CSV
    const processSheet = async (sheetName, targetCsv, transformFn) => {
        if (!wb.Sheets[sheetName]) {
            console.warn(`Sheet ${sheetName} missing. Skipping.`);
            return;
        }
        const json = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
        if (transformFn) {
            for (let row of json) {
                await transformFn(row);
            }
        }
        // Write to CSV
        if (json.length > 0) {
            const csv = stringify(json, { header: true });
            fs.writeFileSync(path.join(CSV_DIR, targetCsv), csv);
            console.log(`   -> Converted ${sheetName} to ${targetCsv} (${json.length} rows)`);
        }
    };

    // Process Students: Hash passwords
    await processSheet('Students', 'students.csv', async (row) => {
        if (row.password_plain) {
            const salt = await bcrypt.genSalt(10);
            row.password_hash = await bcrypt.hash(row.password_plain, salt);
            delete row.password_plain; // Don't write plain to CSV
        }
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
