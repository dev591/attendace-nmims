
import express from 'express';
import { getDailyContent } from '../lib/daily_content.js';

const router = express.Router();

/**
 * GET /debug/daily-content
 * Forces a check/fetch of the daily content and returns it.
 */
router.get('/daily-content', async (req, res) => {
    try {
        const content = await getDailyContent();
        res.json({
            status: 'success',
            today: new Date().toISOString().split('T')[0],
            content
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
