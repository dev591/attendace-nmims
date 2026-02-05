
import { query } from './db.js';

const fix = async () => {
    try {
        console.log("Fixing enrollments for S001...");
        // Enroll S001 in SUB01 (DS101), SUB02 (AL102), SUB03 (DB103), SUB04 (OS104)
        const subjects = ['SUB01', 'SUB02', 'SUB03', 'SUB04'];

        // Fetch student semester/year
        const stud = await query("SELECT semester, year, program FROM students WHERE student_id = 'S001'");
        if (stud.rows.length === 0) throw new Error("S001 not found");
        const { semester } = stud.rows[0];

        // Populate Curriculum for Auto-Enrollment (Login Safe)
        const curriculumData = [
            { code: 'DS101', name: 'Data Structures' },
            { code: 'AL102', name: 'Algorithms' },
            { code: 'DB103', name: 'Database Systems' },
            { code: 'OS104', name: 'Operating System' }
        ];

        for (const c of curriculumData) {
            await query(`
                INSERT INTO curriculum (program, semester, year, subject_code, subject_name)
                VALUES ($1, $2, $3, $4, $5)
            `, ['b.tech cs-ds', 3, 2, c.code, c.name]); // using b.tech cs-ds which matches fallback strategy
            console.log(`Added ${c.code} to Curriculum`);
        }

        for (const sub of subjects) {
            // Check if enrolled
            const check = await query("SELECT id FROM enrollments WHERE student_id = $1 AND subject_id = $2", ['S001', sub]);
            if (check.rows.length === 0) {
                await query(`
                    INSERT INTO enrollments (student_id, subject_id, semester, created_at)
                    VALUES ($1, $2, $3, NOW())
                `, ['S001', sub, semester]);
                console.log(`Enrolled S001 in ${sub}`);
            } else {
                console.log(`S001 already enrolled in ${sub}`);
            }
        }
        console.log("✅ Enrollments & Curriculum fixed.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Fix failed", e);
        process.exit(1);
    }
};

fix();
