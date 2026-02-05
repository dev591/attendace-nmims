
import { getClient } from './db.js';

async function migrate() {
    const client = await getClient();
    try {
        console.log('Starting Migration...');

        // 1. Students: Add section
        await client.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A';
        `);
        console.log('Added section to students.');

        // 2. Sessions: Add columns
        await client.query(`
            ALTER TABLE sessions 
            ADD COLUMN IF NOT EXISTS section TEXT,
            ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'THEORY',
            ADD COLUMN IF NOT EXISTS counts_for_attendance BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS conducted_count INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS program TEXT,
            ADD COLUMN IF NOT EXISTS semester INTEGER,
            ADD COLUMN IF NOT EXISTS branch TEXT;
        `);
        console.log('Added columns to sessions.');

        console.log('Migration Complete.');
    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        client.release();
    }
}

migrate();
