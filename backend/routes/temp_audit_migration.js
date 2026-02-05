import express from 'express';
import { query } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

router.get('/migrate/audit-logs', async (req, res) => {
    try {
        const sqlPath = path.join(__dirname, '../migrations/create_audit_logs.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await query(sql);
        res.json({ success: true, message: "Audit Logs table created" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
