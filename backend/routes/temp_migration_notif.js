import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.get('/run-migration-notif', async (req, res) => {
    try {
        await query(`
            ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
            ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
            ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
            ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE;
            ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_filter JSONB DEFAULT '{}';
            
            CREATE INDEX IF NOT EXISTS idx_notifications_global ON notifications(is_global);
        `);
        res.json({ message: "Notification Migration applied successfully" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
