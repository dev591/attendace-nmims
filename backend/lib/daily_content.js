
import { getClient } from '../db.js';
import { ENGINEERING_CONTENT_POOL } from './content_pool.js';

export async function getDailyContent() {
    const client = await getClient();
    try {
        // 1. Check Cache
        const checkQ = await client.query(`
            SELECT date, type, content, source 
            FROM daily_engineering_content 
            WHERE date = CURRENT_DATE
        `);

        if (checkQ.rows.length > 0) {
            return checkQ.rows[0];
        }

        // 2. Cache Miss -> Fetch / Generate
        // Strategy: Deterministic rotation based on Epoch Day (so it changes every 24h reliably)
        // This ensures if we restart server, we pick the SAME item for "Today", 
        // preventing random changes on restart.

        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const poolIndex = dayOfYear % ENGINEERING_CONTENT_POOL.length;
        const selectedItem = ENGINEERING_CONTENT_POOL[poolIndex];

        // 3. Store in DB
        await client.query(`
            INSERT INTO daily_engineering_content (date, type, content, source)
            VALUES (CURRENT_DATE, $1, $2, $3)
            ON CONFLICT (date) DO NOTHING
        `, [selectedItem.type, selectedItem.content, selectedItem.source]);

        // 4. Return new item
        return {
            date: new Date().toISOString().split('T')[0],
            ...selectedItem
        };

    } catch (e) {
        console.error("Daily Content Service Error:", e);
        // Fallback in case of DB error
        return ENGINEERING_CONTENT_POOL[0];
    } finally {
        client.release();
    }
}
