
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

async function createSchema() {
    const client = await pool.connect();
    try {
        console.log("Creating Timetable Template Schema...");

        // 1. Create TIMETABLE_TEMPLATE Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS timetable_template (
                id SERIAL PRIMARY KEY,
                program TEXT NOT NULL,
                semester INT NOT NULL,
                year INT NOT NULL,
                branch TEXT, -- Optional, for specific branches like 'ce', 'it'
                day_of_week TEXT NOT NULL, -- 'Monday', 'Tuesday'...
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                subject_code TEXT NOT NULL,
                venue TEXT,
                faculty TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Ensure unique slot per program group logic (optional but good for integrity)
                UNIQUE(program, semester, year, day_of_week, start_time, venue) -- Changed room to venue
                -- Actually uniqueness is tricky with batches. Let's keep it simple for now.
            );
        `);
        console.log("Table 'timetable_template' created/verified.");

        // 2. Add Index for fast lookups
        await client.query(`CREATE INDEX IF NOT EXISTS idx_template_program ON timetable_template(program, year, semester);`);
        console.log("Indexes created.");

    } catch (e) {
        console.error("Schema Creation Error:", e);
    } finally {
        client.release();
        pool.end();
    }
}

createSchema();
