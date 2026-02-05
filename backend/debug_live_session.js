
import { query } from './db.js';

async function debug() {
    console.log("🔍 Debugging Session Data...");

    // Check inserted session
    const res = await query("SELECT * FROM sessions WHERE session_id = 'SESS_TEST_LIVE'");
    console.log("Session Row:", res.rows[0]);

    // Check mapping
    const mapRes = await query("SELECT * FROM course_subjects WHERE faculty_name = 'Dr. Live Test'");
    console.log("Mapping Row:", mapRes.rows);

    // Check Faculty
    const facRes = await query("SELECT * FROM students WHERE sapid = 'FAC_TEST_LIVE'");
    console.log("Faculty Row:", facRes.rows[0]);

    // Check Current Date in DB
    const dateRes = await query("SELECT CURRENT_DATE, CURRENT_TIME, CURRENT_TIMESTAMP");
    console.log("DB Time:", dateRes.rows[0]);

    console.log("Node Time:", new Date().toString());

    process.exit(0);
}

debug();
