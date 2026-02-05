import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.get('/run-migration-lost-found', async (req, res) => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS lost_items (
                id SERIAL PRIMARY KEY,
                student_id TEXT REFERENCES students(student_id),
                item_name TEXT NOT NULL,
                description TEXT,
                location_lost TEXT,
                image_url TEXT NOT NULL,
                status TEXT DEFAULT 'pending', -- pending, approved, rejected, resolved
                security_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_lost_items_status ON lost_items(status);
        `);
        res.json({ message: "Migration applied successfully" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
