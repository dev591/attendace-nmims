import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { socketService } from '../services/socket_service.js';

const router = express.Router();
router.use(authenticateToken); // Protect all routes

// Helper: Check if two users are friends
const areFriends = async (user1, user2) => {
    const res = await query(`
        SELECT 1 FROM connections 
        WHERE ((requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1))
          AND status = 'accepted'
    `, [user1, user2]);
    return res.rowCount > 0;
};

// 1. Send Connection Request
router.post('/connect', async (req, res) => {
    try {
        const { target_id } = req.body;
        const requester_id = req.user.student_id;

        if (requester_id === target_id) return res.status(400).json({ error: "Cannot connect with self" });

        // Check if blocked or already connected
        const existing = await query(
            "SELECT status FROM connections WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)",
            [requester_id, target_id]
        );

        if (existing.rowCount > 0) {
            const status = existing.rows[0].status;
            if (status === 'blocked') return res.status(403).json({ error: "Cannot connect to this user." });
            if (status === 'accepted') return res.status(400).json({ error: "Already connected." });
            if (status === 'pending') return res.status(400).json({ error: "Request already pending." });
        }

        await query(
            "INSERT INTO connections (requester_id, receiver_id, status) VALUES ($1, $2, 'pending') ON CONFLICT (requester_id, receiver_id) DO NOTHING",
            [requester_id, target_id]
        );

        // Fetch Requester Name for Notification
        const { rows } = await query("SELECT name FROM students WHERE student_id = $1", [requester_id]);
        const requesterName = rows[0]?.name || "Someone";

        // Real-time Notification
        const notifData = {
            student_id: target_id,
            type: 'CONNECTION_REQUEST', // 'info' | 'success' | 'warning' | 'danger' usually, but custom types work for logic
            title: `New Connection Request`,
            message: `${requesterName} wants to connect with you.`,
            action_url: '/network',
            created_at: new Date()
        };

        // Persist Notification
        await query(
            "INSERT INTO notifications (student_id, type, title, message, action_url) VALUES ($1, $2, $3, $4, $5)",
            [target_id, 'info', notifData.title, notifData.message, notifData.action_url]
        );

        // Emit
        socketService.emitToUser(target_id, 'notification', notifData);

        res.json({ success: true, message: "Request sent" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Accept/Reject Request
router.post('/respond', async (req, res) => {
    try {
        const { connection_id, action } = req.body; // action: 'accept' or 'reject'
        const user_id = req.user.student_id;
        const status = action === 'accept' ? 'accepted' : 'rejected';

        // Verify it is a request SENT TO current user
        const result = await query(
            "UPDATE connections SET status = $1 WHERE id = $2 AND receiver_id = $3 RETURNING *",
            [status, connection_id, user_id]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: "Request not found (or not yours)" });

        if (status === 'accepted') {
            const conn = result.rows[0];
            const requester_id = conn.requester_id;

            // Fetch Acceptor Name
            const { rows } = await query("SELECT name FROM students WHERE student_id = $1", [user_id]);
            const myName = rows[0]?.name || "A student";

            // Notify Requester
            const notifData = {
                student_id: requester_id,
                type: 'success',
                title: `Request Accepted`,
                message: `${myName} accepted your connection request.`,
                action_url: `/network/profile/${user_id}`, // or chat
                created_at: new Date()
            };

            await query(
                "INSERT INTO notifications (student_id, type, title, message, action_url) VALUES ($1, $2, $3, $4, $5)",
                [requester_id, 'success', notifData.title, notifData.message, notifData.action_url]
            );

            socketService.emitToUser(requester_id, 'notification', notifData);
        }

        res.json({ success: true, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Block User
router.post('/block', async (req, res) => {
    try {
        const { target_id } = req.body;
        const user_id = req.user.student_id;

        // Check if connection exists, if so update, else insert
        // Note: 'connections' table has unique constraint on (requester, receiver).
        // But (A, B) is different from (B, A). We need to handle both directions or ensure consistent ordering.
        // Current Schema seems to allow (A,B) and (B,A) potentially? Or code usually handles one direction.
        // Let's assume we update any existing link to 'blocked'.

        // Simpler: Just delete any existing link and insert a new BLOCK link where requester=me, receiver=target, status='blocked'
        // But we need to ensure we don't have duplicate reverse link.

        await query("DELETE FROM connections WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)", [user_id, target_id]);

        await query(
            "INSERT INTO connections (requester_id, receiver_id, status) VALUES ($1, $2, 'blocked')",
            [user_id, target_id]
        );

        res.json({ success: true, message: "User blocked." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Get Messages (Chat History) -> Polling/Refresh source
router.get('/messages/:friendId', async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.student_id;

        // Security: Strict Friendship Check
        const isFriend = await areFriends(userId, friendId);
        if (!isFriend) {
            return res.status(403).json({ error: "Access Denied: You are not connected with this user." });
        }

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

// 5. Send Message
router.post('/message', async (req, res) => {
    try {
        const { receiver_id, text } = req.body;
        const sender_id = req.user.student_id;

        // Security: Strict Friendship Check
        const isFriend = await areFriends(sender_id, receiver_id);
        if (!isFriend) {
            return res.status(403).json({ error: "Cannot message: You are not connected." });
        }

        const result = await query(
            "INSERT INTO messages (sender_id, receiver_id, text) VALUES ($1, $2, $3) RETURNING *",
            [sender_id, receiver_id, text]
        );

        const savedMsg = result.rows[0];

        // Real-time Emit
        socketService.emitToUser(receiver_id, 'new_message', savedMsg);

        res.json({ success: true, message: savedMsg });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Get My Connections (Requests & Friends)
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
            SELECT s.name, s.student_id, s.sapid, s.role, s.dept, s.program
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
