
import { getClient } from './db.js';

async function migrateSchool() {
    const client = await getClient();
    try {
        console.log('Starting School Scope Migration...');

        // 1. Add School column to key tables
        await client.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS school TEXT DEFAULT 'MPSTME'; -- Default for existing Engg users
            
            ALTER TABLE sessions 
            ADD COLUMN IF NOT EXISTS school TEXT DEFAULT 'MPSTME';

            ALTER TABLE curriculum 
            ADD COLUMN IF NOT EXISTS school TEXT DEFAULT 'MPSTME';
        `);
        console.log('Added school columns.');

        console.log('Migration Complete.');
    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        client.release();
    }
}

migrateSchool();
