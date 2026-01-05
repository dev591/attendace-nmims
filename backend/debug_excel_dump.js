
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target the specific file identified from 'ls'
const FILE_NAME = 'import_1765865729018_Student_Master_Engineering_DS_CE.xlsx';
const FILE_PATH = path.join(__dirname, 'uploads', FILE_NAME);

function inspectExcel() {
    console.log(`🕵️‍♀️ INSPECTING FILE: ${FILE_NAME}`);

    try {
        const workbook = xlsx.readFile(FILE_PATH);
        const sheetName = workbook.SheetNames[0]; // Assume first sheet
        console.log(`📂 Sheet Name: '${sheetName}'`);

        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null }); // defval: null ensures we see empty cells as null, not undefined

        if (rows.length === 0) {
            console.log("❌ Sheet is EMPTY.");
            return;
        }

        // 1. INSPECT HEADERS
        const headers = Object.keys(rows[0]);
        console.log(`\n📋 HEADERS DETECTED:`, headers);

        // 2. FIND TARGET STUDENT
        const targetId = '90030002';
        const studentRow = rows.find(r => {
            // Flexible match
            return Object.values(r).some(v => String(v).includes(targetId));
        });

        if (studentRow) {
            console.log(`\n👤 ROW FOR ${targetId}:`);
            console.log(JSON.stringify(studentRow, null, 2));

            // 3. ANALYZE BRANCH VALUE
            // Check likely candidates
            const candidates = ['branch', 'Branch', 'BRanch', 'dept', 'Dept', 'Department', 'Specialization'];
            console.log(`\n🔎 LOOKUP ANALYSIS:`);
            for (const key of Object.keys(studentRow)) {
                if (candidates.some(c => c.toLowerCase() === key.toLowerCase())) {
                    console.log(`   MATCHED KEY '${key}': Value = '${studentRow[key]}' (Type: ${typeof studentRow[key]})`);
                }
            }
        } else {
            console.log(`❌ Student ${targetId} NOT FOUND in sheet.`);
            console.log(`   Sample Row 1:`, rows[0]);
        }

    } catch (e) {
        console.error(`❌ FAILED TO READ FILE: ${e.message}`);
    }
}

inspectExcel();
