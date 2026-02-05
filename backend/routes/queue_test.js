
import express from 'express';
import { addEmailJob, addAnalyticsJob } from '../lib/queue/queue.js';

const router = express.Router();

router.post('/trigger-email', async (req, res) => {
    try {
        const { to, subject, forceFail } = req.body;
        const job = await addEmailJob({ to, subject, forceFail });
        res.json({ message: 'Email job triggered', jobId: job.id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/trigger-analytics', async (req, res) => {
    try {
        const { studentId } = req.body;
        const job = await addAnalyticsJob({ studentId });
        res.json({ message: 'Analytics job triggered', jobId: job.id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
