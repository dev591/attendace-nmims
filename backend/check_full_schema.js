
import 'dotenv/config';
import { query } from './db.js';

async function check() {
    console.log("🔍 Checking Schema for 'branch' related columns...");

    const studentsCols = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'students'
        ORDER BY ordinal_position
    `);
    console.log("\n--- STUDENTS Table Columns ---");
    console.table(studentsCols.rows);

    const currCols = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'curriculum'
        ORDER BY ordinal_position
    `);
    console.log("\n--- CURRICULUM Table Columns ---");
    console.table(currCols.rows);

    process.exit();
}
check();
