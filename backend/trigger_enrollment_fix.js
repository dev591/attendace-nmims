
import { autoEnrollStudent } from './lib/enrollment_service.js';

async function triggerFix() {
    console.log("🛠 TRIGGERING ENROLLMENT FIX...");
    // S90030770: Program='engineering' (mapped), Branch='CE', Year=3, Sem=5
    // Note: Pass 'Engineering' as program to mimic what comes from DB/Frontend before normalization
    const count = await autoEnrollStudent('S90030770', 'Engineering', 'CE', 5, 3);

    if (count > 0) {
        console.log(`✅ SUCCESS! Enrolled in ${count} subjects.`);
    } else {
        console.log("❌ FAILURE! Still enrolls 0 subjects.");
    }
    process.exit();
}

triggerFix();
