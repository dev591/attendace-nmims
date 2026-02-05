
import { query } from './db.js';

async function getRandomStudent() {
    try {
        const res = await query("SELECT sapid, program, dept, year, semester FROM students ORDER BY RANDOM() LIMIT 1");
        if (res.rows.length === 0) {
            console.log("No students found.");
        } else {
            console.log("Random Student:", res.rows[0]);
        }
    } catch (err) {
        console.error("Error fetching student:", err);
    }
    process.exit();
}

getRandomStudent();
