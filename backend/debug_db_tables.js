
import { query } from './db.js';

const debug = async () => {
    try {
        console.log("--- Tables ---");
        const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(tables.rows.map(t => t.table_name).join(", "));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};

debug();
