import express from 'express';
import { query } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

router.get('/debug/migrate/notifications', async (req, res) => {
    try {
        const sqlPath = path.join(__dirname, '../migrations/create_notifications.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await query(sql);
        res.json({ success: true, message: "Notifications table created" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
