
import { query } from './db.js';

async function inspect() {
    try {
        const res = await query('SELECT * FROM badges');
        console.log(`Badges Count: ${res.rowCount}`);
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
inspect();
