
import { query, getClient } from './db.js';
import bcrypt from 'bcryptjs';

async function resetPass() {
    const client = await getClient();
    try {
        const hash = await bcrypt.hash('password123', 10);
        await client.query("UPDATE students SET password_hash = $1 WHERE sapid = 'S9000000'", [hash]);
        console.log("Password for S9000000 reset to 'password123'");
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}
resetPass();
