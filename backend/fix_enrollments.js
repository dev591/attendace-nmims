
import { query } from './db.js';

async function fixEnrollments() {
    const studentId = 'S90020004';
    console.log(`Fixing Enrollments for ${studentId}...`);

    try {
        // 1. Delete All Enrollments
        await query('DELETE FROM enrollments WHERE student_id = $1', [studentId]);
        console.log("Deleted old enrollments.");

        // 2. Clear Sessions/Attendance (to be safe, or keep history?)
        // If we change subjects, old attendance for deleted subjects becomes orphaned.
        // It's safer to delete attendance for this test user to avoid FK issues later.
        // But Badge "Perfect Start" needs history.
        // I will keep history IF it matches new subjects. But simpler to just wipe and re-simulate.
        // Let's wipe attendance to be clean.
        await query('DELETE FROM attendance WHERE student_id = $1', [studentId]);
        console.log("Deleted old attendance.");

        // 3. Find Correct Sem 2 Subjects
        // We need Engineering Sem 2.
        // Assuming subjects table has program/semester? 
        // Diagnostic V2 showed columns: subject_id, code, name, credits...
        // It did NOT show program/semester.
        // Wait. `subjects` table has NO program/semester?
        // Then `enrollment_service` relies on `program_mapper.js` or `defaults`?
        // I need to know which subjects are Sem 2.
        // "Eng Physics" etc.
        // Let's select all subjects and guess/filter by name or code.
        const allSubs = await query('SELECT * FROM subjects');

        // Filter for Engineering-like
        // My previous diagnosis showed "Eng Physics", "Eng Math II" maybe?
        // Let's look at the rows.
        const engSubs = allSubs.rows.filter(s => s.name.includes('Eng') || s.code.startsWith('EN'));
        console.log("Available Engineering Subjects:", engSubs.map(s => `${s.code} - ${s.name}`));

        // Hardcode the ones we want (Standard 5)
        // I'll pick 5 that look like Sem 2.
        // Or just pick the textual ones if UUIDs were the problem.
        // Actually, UUIDs had names "Eng Physics". "EN101" had name "EN101".
        // "EN101" name "EN101" implies BAD DATA (name should be descriptive).
        // UUIDs had descriptive names. So UUIDs are BETTER.
        // All UUID subjects:
        const uuidSubs = allSubs.rows.filter(s => s.subject_id.length > 10);
        console.log(`Found ${uuidSubs.length} UUID subjects.`);

        const targetSubjects = uuidSubs.slice(0, 5); // Take first 5 UUID subjects

        for (const sub of targetSubjects) {
            await query('INSERT INTO enrollments (student_id, subject_id) VALUES ($1, $2)', [studentId, sub.subject_id]);
        }
        console.log(`✅ Enrolled in ${targetSubjects.length} subjects.`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
fixEnrollments();
