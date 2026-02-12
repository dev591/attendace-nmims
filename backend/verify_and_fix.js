
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

async function verifyAndFix() {
    const client = await pool.connect();
    try {
        console.log("--- VERIFICATION ---");
        const sapid = '590000005';

        // Check Enrollments
        const res = await client.query(`
            SELECT count(*) as count 
            FROM enrollments e 
            JOIN students s ON e.student_id = s.student_id 
            WHERE s.sapid = $1
        `, [sapid]);
        console.log(`Student ${sapid} has ${res.rows[0].count} enrollments.`);

        // Check Subject Names
        const subRes = await client.query(`
            SELECT sub.name, sub.code 
            FROM enrollments e 
            JOIN students s ON e.student_id = s.student_id 
            JOIN subjects sub ON e.subject_id = sub.subject_id
            WHERE s.sapid = $1
        `, [sapid]);
        console.log("Enrolled Subjects:");
        subRes.rows.forEach(r => console.log(`- [${r.code}] ${r.name}`));

        console.log("\n--- SCHEMA FIX ---");
        // Add is_onboarded if missing
        try {
            await client.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE");
            console.log("Added column: is_onboarded");
        } catch (e) {
            console.log("Schema fix error:", e.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

verifyAndFix();
