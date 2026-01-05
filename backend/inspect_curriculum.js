import { query } from './db.js';

async function inspect() {
    try {
        const { rows } = await query(`SELECT * FROM curriculum WHERE lower(program) = 'mba' ORDER BY subject_code`);
        console.table(rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

inspect();
