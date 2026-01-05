
import { getSubjectsForStudent } from './lib/subject_service.js';

async function verify() {
    console.log("Verifying Subject Service for S90020004...");
    try {
        const res = await getSubjectsForStudent('S90020004'); // Using Student ID
        console.log(`Success! Found ${res.subjects.length} subjects.`);
        res.subjects.forEach(s => console.log(` - ${s.subject_code}: ${s.subject_name}`));
    } catch (e) {
        console.error("FAIL:", e);
    } finally {
        process.exit();
    }
}
verify();
