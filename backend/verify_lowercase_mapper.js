
import { normalizeBranch } from './lib/program_branch_mapper.js';

function verify() {
    console.log("🧪 Verifying Lowercase Branch Normalization...");

    const cases = [
        { input: "DS", expected: "ds" },
        { input: "Data Science", expected: "ds" },
        { input: "CE", expected: "ce" },
        { input: "Computer Engineering", expected: "ce" },
        { input: "B.Tech CS", expected: "ce" },
        { input: "CS", expected: "ce" },
        { input: "EXTC", expected: "extc" },
        { input: "Unknown", expected: "unknown" } // Default behavior
    ];

    let passed = true;

    for (const c of cases) {
        const out = normalizeBranch(c.input);
        if (out === c.expected) {
            console.log(`   ✅ '${c.input}' -> '${out}'`);
        } else {
            console.log(`   ❌ '${c.input}' -> '${out}' (Expected: '${c.expected}')`);
            passed = false;
        }
    }

    if (passed) {
        console.log("✅ ALL TESTS PASSED. Mapper strictly returns lowercase.");
    } else {
        console.error("❌ MAPPING FAILED.");
        process.exit(1);
    }
}

verify();
