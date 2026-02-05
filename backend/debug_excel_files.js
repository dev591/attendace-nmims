
import xlsx from 'xlsx';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'uploads');
const studentFile = path.join(uploadsDir, 'import_1767548720317_Student_Master_100.xlsx');
const curriculumFile = path.join(uploadsDir, 'import_1767724274434_Curriculum_100_Mixed.xlsx');

function dumpFile(filePath, name) {
    try {
        console.log(`\n--- DUMPING ${name} ---`);
        console.log(`Path: ${filePath}`);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }); // Array of arrays

        if (rows.length > 0) {
            console.log("HEADERS:", rows[0]);
            console.log("ROW 1:", rows[1]);
            console.log("ROW 2:", rows[2]);
        } else {
            console.log("File is empty or invalid format.");
        }

        // Also dump as object to see keys
        const objs = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        if (objs.length > 0) {
            console.log("FIRST RECORD (JSON):", objs[0]);
        }
        return objs;
    } catch (err) {
        console.error(`Error reading ${name}:`, err.message);
        return [];
    }
}

const students = dumpFile(studentFile, "STUDENTS");
const curriculum = dumpFile(curriculumFile, "CURRICULUM");

// Check for a sample match
if (students.length > 0 && curriculum.length > 0) {
    const s = students[0];
    const sapid = s['Sapid'] || s['SAPID'] || s['sapid'];
    console.log(`\n--- MATCH CHECK for Student ${sapid} ---`);
    console.log(`From Student File -> Program: ${s['Program']}, Dept: ${s['Branch'] || s['Dept']}`);

    // Simple normalization check
    const clean = (str) => String(str).toLowerCase().trim();
    const sProgram = clean(s['Program']);
    const sBranch = clean(s['Branch'] || s['Dept'] || '');

    console.log(`Normalized Student Key: ${sProgram}-${sBranch}`);

    // Find consistent curriculum
    const matches = curriculum.filter(c => {
        const cProgram = clean(c['Program']);
        // Curriculum files sometimes don't have Branch column if it's mixed? 
        // Or they imply it in Program? 
        return cProgram.includes(sProgram);
    });

    console.log(`Found ${matches.length} matches in Curriculum file containing '${sProgram}'`);
    if (matches.length > 0) {
        console.log("Sample Curriculum Match:", matches[0]);
    }
}
