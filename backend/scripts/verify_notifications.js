
import { NotificationService } from '../services/NotificationService.js';
import { query } from '../db.js';

const verify = async () => {
    try {
        console.log("Starting Notification Verification...");

        // 1. Test Notify Role (Director)
        console.log("Testing Notify Role 'director'...");
        await NotificationService.notifyRole({
            role: 'director',
            title: 'Test Global Director Alert',
            message: 'This is a test notification for all directors.',
            type: 'info'
        });

        // Verify DB
        const res = await query("SELECT * FROM notifications WHERE title = 'Test Global Director Alert' ORDER BY created_at DESC LIMIT 1");
        if (res.rows.length > 0) {
            console.log("✅ Director Notification Created:", res.rows[0]);
        } else {
            console.error("❌ No Director Notification found! Check if any user has role='director'.");
        }

        console.log("Verification Complete.");
        process.exit(0);
    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    }
};

verify();
