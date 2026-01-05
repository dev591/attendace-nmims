/* ADDED BY ANTI-GRAVITY */
import express from 'express';
import { evaluateBadgesForAll, getStudentBadges, getAllBadgeDefs, awardBadge } from '../badges_service.js';
import { query } from '../db.js';

const router = express.Router();

// GET /badges -> all badge defs
router.get('/', async (req, res) => {
    try {
        const defs = await getAllBadgeDefs();
        res.json(defs);
    } catch (err) { console.error(err); res.status(500).json({ error: 'server error' }); }
});

// GET /student/:student_id/badges
router.get('/student/:student_id', async (req, res) => {
    try {
        const student_id = req.params.student_id;
        const badges = await getStudentBadges(student_id);
        res.json(badges);
    } catch (err) { console.error(err); res.status(500).json({ error: 'server error' }); }
});

// POST /admin/:badge_key/award  (body { student_id })
router.post('/admin/:badge_key/award', async (req, res) => {
    try {
        const badge_key = req.params.badge_key;
        const { student_id } = req.body;
        if (!student_id) return res.status(400).json({ error: 'student_id required' });
        // find badge id
        const bq = await query('SELECT id FROM badges WHERE badge_key=$1', [badge_key]);
        if (bq.rows.length === 0) return res.status(404).json({ error: 'badge not found' });
        const bid = bq.rows[0].id;
        const ok = await awardBadge(student_id, bid, { manual: true });
        res.json({ ok, badge_key });
    } catch (err) { console.error(err); res.status(500).json({ error: 'server error' }); }
});

// POST /badges/evaluate -> trigger evaluation for all
router.post('/evaluate', async (req, res) => {
    try {
        // run in background but respond quickly
        evaluateBadgesForAll().catch(e => console.error('background eval error', e));
        res.json({ ok: true, message: 'evaluation triggered' });
    } catch (err) { console.error(err); res.status(500).json({ error: 'server error' }); }
});

export default router;
