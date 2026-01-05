import { query } from './db.js';

async function checkEngineering() {
    try {
        console.log('🔍 Checking Engineering Curriculum...');
        const { rows } = await query(`
            SELECT count(*) as count, semester, year 
            FROM curriculum 
            WHERE lower(program) = 'engineering' 
            GROUP BY year, semester 
            ORDER BY year, semester
        `);

        if (rows.length === 0) {
            console.log('❌ FATAL: No Engineering subjects in Curriculum table!');
            // Check legacy table to see what we are missing
            const legacy = await query(`SELECT count(*) FROM course_subjects`);
            console.log(`⚠️ Legacy 'course_subjects' has ${legacy.rows[0].count} entries.`);
        } else {
            console.table(rows);
            console.log('✅ Engineering Curriculum seems populated.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

checkEngineering();
