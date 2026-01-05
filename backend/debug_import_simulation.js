
import { normalizeHeader } from './lib/import_helpers.js';
import { normalizeBranch } from './lib/program_branch_mapper.js';

// MOCKING the logic from import_single_file.js exactly
function simulate() {
    console.log("🧪 SIMULATING IMPORT LOGIC with REAL DATA...");

    const row = {
        "sapid": 90030002,
        "name": "Student_DS_2",
        "program": "engineering",
        "branch": "DS",
        "year": 1,
        "semester": 1,
        "password": "password123"
    };

    console.log("   Input Row:", row);

    // 1. Helper: Fuzzy Finder (copied from import_single_file.js)
    const findVal = (row, keys) => {
        const rowKeys = Object.keys(row);
        for (const k of keys) {
            // Exact match?
            if (row[k] !== undefined) return row[k];
            // Fuzzy match?
            const match = rowKeys.find(rk => normalizeHeader(rk) === normalizeHeader(k));
            if (match && row[match] !== undefined) return row[match];
        }
        return undefined;
    };

    // 2. Extraction (copied)
    const rawProg = findVal(row, ['program', 'prog', 'stream', 'course']);
    // Fallback logic
    const rawBranch = findVal(row, ['branch', 'specialization', 'dept', 'department']) || rawProg;

    console.log(`   findVal('branch') result: '${findVal(row, ['branch', 'specialization', 'dept', 'department'])}'`);
    console.log(`   rawBranch resolved to: '${rawBranch}'`);

    // 3. Normalization (copied)
    let branch = normalizeBranch(rawBranch);
    if (branch) branch = branch.toLowerCase();

    // Specific Fix logic
    if (rawProg && rawProg.toLowerCase().includes('data science') && !branch) branch = 'ds';

    console.log(`   Final Branch: '${branch}'`);

    if (!branch) {
        console.log("   ❌ RESULT: BRANCH IS NULL (Would Throw Error)");
    } else {
        console.log("   ✅ RESULT: Valid Branch (Success)");
    }
}

simulate();
