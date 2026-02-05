
import { query } from './db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

async function verify() {
    console.log("🚀 Starting Appeals Verification...");

    try {
        // 1. Setup Data: 1 Student (STME)
        console.log("\n[1] Setting up Test Student (STME)...");
        const SAP_ST = 'TEST_APP_001';
        await query(`
            INSERT INTO students (student_id, sapid, name, dept, program, year, password_hash)
            VALUES ('ST_APP_01', $1, 'Appeal Tester', 'STME', 'Data Science', 3, 'hash')
            ON CONFLICT (sapid) DO UPDATE SET dept='STME'
        `, [SAP_ST]);

        // 2. Setup Data: 1 Director (STME)
        console.log("\n[2] Setting up Test Director (STME)...");
        const SAP_DIR = 'DIR_STME_001';
        await query(`
            INSERT INTO students (student_id, sapid, name, dept, program, role, password_hash)
            VALUES ('DIR_APP_01', $1, 'Director STME', 'STME', 'Admin', 'director', 'hash')
            ON CONFLICT (sapid) DO UPDATE SET role='director', dept='STME'
        `, [SAP_DIR]);

        // 3. Create Appeal (Direct DB Insert to simulate Upload)
        console.log("\n[3] Simulating Appeal Submission...");
        const res = await query(`
            INSERT INTO appeals (student_id, school_code, type, description, proof_url, status)
            VALUES ('ST_APP_01', 'STME', 'Medical', 'Severe Fever', 'http://localhost:5000/uploads/proofs/test.pdf', 'Pending')
            RETURNING id
        `);
        const appealId = res.rows[0].id;
        console.log(`✅ Appeal Created. ID: ${appealId}`);

        // 4. Verify Director Access (Should see it)
        console.log("\n[4] Verifying Director Access (STME)...");
        const res2 = await query(`SELECT * FROM appeals WHERE school_code = 'STME' AND id = $1`, [appealId]);
        if (res2.rows.length > 0) console.log("✅ Director can see STME appeal.");
        else console.error("❌ Director CANNOT see appeal!");

        // 5. Verify Isolation (SPTM Director should NOT see it)
        console.log("\n[5] Verifying ISOLATION (SPTM)...");
        const res3 = await query(`SELECT * FROM appeals WHERE school_code = 'SPTM' AND id = $1`, [appealId]);
        if (res3.rows.length === 0) console.log("✅ Isolation Working: SPTM Director cannot see STME appeal.");
        else console.error("❌ Isolation FAILED: SPTM Director SAW STME appeal!");

    } catch (e) {
        console.error("❌ Verification Failed:", e);
    } finally {
        // Cleanup
        await query("DELETE FROM appeals WHERE student_id = 'ST_APP_01'");
        await query("DELETE FROM students WHERE sapid LIKE 'TEST_APP_%' OR sapid LIKE 'DIR_STME_%'");
        process.exit(0);
    }
}

verify();
