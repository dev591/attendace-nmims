import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken); // Protect all routes

// 1. Send Connection Request
router.post('/connect', async (req, res) => {
    try {
        const { target_id } = req.body;
        const requester_id = req.user.student_id;

        if (requester_id === target_id) return res.status(400).json({ error: "Cannot connect with self" });

        await query(
            "INSERT INTO connections (requester_id, receiver_id, status) VALUES ($1, $2, 'pending') ON CONFLICT (requester_id, receiver_id) DO NOTHING",
            [requester_id, target_id]
        );
        res.json({ success: true, message: "Request sent" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Accept/Reject Request
router.post('/respond', async (req, res) => {
    try {
        const { connection_id, action } = req.body; // action: 'accept' or 'reject'
        const user_id = req.user.student_id;
        const status = action === 'accept' ? 'accepted' : 'rejected';

        const result = await query(
            "UPDATE connections SET status = $1 WHERE id = $2 AND receiver_id = $3 RETURNING *",
            [status, connection_id, user_id]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: "Request not found (or not yours)" });
        res.json({ success: true, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Messages (Chat History) -> Polling/Refresh source
router.get('/messages/:friendId', async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.student_id;

        const { rows } = await query(`
            SELECT * FROM messages 
            WHERE (sender_id = $1 AND receiver_id = $2) 
               OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
            LIMIT 100
        `, [userId, friendId]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Send Message
router.post('/message', async (req, res) => {
    try {
        const { receiver_id, text } = req.body;
        const sender_id = req.user.student_id;

        await query(
            "INSERT INTO messages (sender_id, receiver_id, text) VALUES ($1, $2, $3)",
            [sender_id, receiver_id, text]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Get My Connections (Requests & Friends)
router.get('/my-network', async (req, res) => {
    try {
        const userId = req.user.student_id;

        // Pending Requests (Received)
        const pendingRes = await query(`
            SELECT c.id, s.name, s.student_id, s.role, s.dept, s.program
            FROM connections c
            JOIN students s ON c.requester_id = s.student_id
            WHERE c.receiver_id = $1 AND c.status = 'pending'
        `, [userId]);

        // Accepted Friends
        const friendsRes = await query(`
            SELECT s.name, s.student_id, s.role, s.dept
            FROM connections c
            JOIN students s ON (c.requester_id = s.student_id OR c.receiver_id = s.student_id)
            WHERE (c.requester_id = $1 OR c.receiver_id = $1) 
              AND s.student_id != $1
              AND c.status = 'accepted'
        `, [userId]);

        res.json({
            pending: pendingRes.rows,
            friends: friendsRes.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
