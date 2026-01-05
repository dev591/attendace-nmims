
import { normalizeBranch } from './lib/program_branch_mapper.js';
import { autoEnrollStudent } from './lib/enrollment_service.js';

// MOCK the logic from import_single_file.js
async function simulateImportRow(row) {
    console.log(`\n🧪 SIMULATING ROW:`, row);

    // 1. Extraction Logic
    const findVal = (r, keys) => {
        for (const k of keys) {
            if (r[k]) return r[k];
            // Simple check, ignoring case normalization for this quick test
            const lowerK = k.toLowerCase();
            const match = Object.keys(r).find(rk => rk.toLowerCase() === lowerK);
            if (match) return r[match];
        }
        return undefined;
    };

    const rawProg = findVal(row, ['program', 'prog', 'stream', 'course']);
    const rawBranch = findVal(row, ['branch', 'specialization', 'dept', 'department']) || rawProg;

    console.log(`   Raw Prog: '${rawProg}'`);
    console.log(`   Raw Branch (after fallback): '${rawBranch}'`);

    const branch = normalizeBranch(rawBranch);
    console.log(`   Normalized Branch: '${branch}'`);

    // 2. Strict Enrollment Logic
    try {
        await autoEnrollStudent('S_TEST_FAIL', 'Engineering', branch, 1, 1);
        console.log("   ✅ Enrollment Logic Accepted this branch.");
    } catch (e) {
        console.log(`   ❌ Enrollment Failed: ${e.message}`);
    }
}

async function runTest() {
    // Scenario 1: User says "Branch is in Excel", maybe they mean "Program" says "CS"?
    // And they rely on fallback?
    await simulateImportRow({
        program: 'B.Tech CS',
        // No Dept column
    });

    // Scenario 2: Dept column present but empty string
    await simulateImportRow({
        program: 'B.Tech CS',
        dept: ''
    });

    // Scenario 3: Valid Dept
    await simulateImportRow({
        program: 'B.Tech CS',
        dept: 'DS'
    });

    process.exit();
}

runTest();
