
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

async function refine() {
    const client = await pool.connect();
    try {
        console.log("Refining Curriculum Branches...");

        // 1. Fetch all generic 'engineering' subjects
        const res = await client.query("SELECT * FROM curriculum WHERE lower(program) = 'engineering'");
        console.log(`Found ${res.rows.length} generic engineering subjects.`);

        for (const row of res.rows) {
            let newProgram = 'engineering';
            const code = row.subject_code.toUpperCase();

            // Heuristics based on typical codes
            if (code.startsWith('CS')) newProgram = 'engineering-ce';
            else if (code.startsWith('IT')) newProgram = 'engineering-it';
            else if (code.startsWith('ME')) newProgram = 'engineering-mech';
            else if (code.startsWith('EX')) newProgram = 'engineering-extc';
            else if (code.startsWith('CV')) newProgram = 'engineering-civil';
            else if (code.startsWith('AI')) newProgram = 'engineering-ai-ml';
            else if (code.startsWith('DS')) newProgram = 'engineering-ds';

            // Common First Year Pattern (FE)
            if (row.year === 1) {
                // First year is often common, keep as 'engineering' OR specific 'engineering-fe'
                // Let's keep it as 'engineering' for now, or maybe duplicate for all branches?
                // Usually FE is common.
                console.log(`[SKIP] Keeping Year 1 Subject ${code} as generic.`);
                continue;
            }

            if (newProgram !== 'engineering') {
                console.log(`[UPDATE] ${code}: engineering -> ${newProgram}`);
                await client.query("UPDATE curriculum SET program = $1 WHERE id = $2", [newProgram, row.id]);
            }
        }
        console.log("Refinement Complete.");

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

refine();
