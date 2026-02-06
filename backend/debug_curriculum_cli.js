import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { normalizeProgram, normalizeBranch } from './lib/program_branch_mapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const findKey = (row, target) => {
    const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetClean = clean(target);
    for (const key of Object.keys(row)) {
        if (clean(key) === targetClean) return row[key];
    }
    return undefined;
};

// GET LATEST UPLOAD
const uploadDir = path.join(__dirname, 'uploads');
const files = fs.readdirSync(uploadDir)
    .filter(f => f.includes('import') && (f.endsWith('.xlsx') || f.endsWith('.csv')))
    .map(f => ({ name: f, time: fs.statSync(path.join(uploadDir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

if (files.length === 0) {
    console.error("No uploaded files found.");
    process.exit(1);
}

const file = files[0];
console.log(`\n🔎 ANALYZING LATEST FILE: ${file.name}`);
const workbook = xlsx.readFile(path.join(uploadDir, file.name));
const sheetName = workbook.SheetNames[0];
const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`Found ${rows.length} rows.`);

if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    console.log(`\nHEADERS FOUND: [${headers.join(', ')}]`);

    console.log("--- ROW 1 SIMULATION ---");
    const row = rows[0];
    const rawProgram = findKey(row, 'Program');
    const rawBranch = findKey(row, 'Branch') || findKey(row, 'Stream');

    console.log(`Raw Program: '${rawProgram}'`);
    console.log(`Raw Branch: '${rawBranch}'`);

    const program = normalizeProgram(rawProgram);
    const branch = normalizeBranch(rawBranch);

    console.log(`Normalized Program: '${program}'`);
    console.log(`Normalized Branch: '${branch}'`);

    let finalProgram = program;
    if (program === 'engineering' && branch) {
        finalProgram = `${program}-${branch}`;
        console.log(`Final Combined Program: '${finalProgram}'`);
    }

    const rawSubjectCode = findKey(row, 'SubjectCode') || findKey(row, 'Code') || findKey(row, 'Subject_Code');
    console.log(`Subject Code: '${rawSubjectCode}'`);

    if (!finalProgram || !rawSubjectCode) {
        console.error("❌ SKIPPED: Missing Program or Subject Code");
    } else {
        console.log("✅ SUCCESS: Row would be accepted.");
    }
}
