import { query } from '../db.js';
import { socketService } from './socket_service.js';

export const NotificationService = {
    /**
     * Send a notification to a single student
     */
    sendToStudent: async ({ studentId, title, message, type = 'info', link = null, metadata = {} }) => {
        try {
            console.log(`[NotificationService] Sending to ${studentId}: ${title}`);
            const res = await query(
                `INSERT INTO notifications (student_id, title, message, type, link, metadata) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [studentId, title, message, type, link, metadata]
            );
            console.log(`[NotificationService] DB Result: RowCount=${res.rowCount}, Error=${res.error}`);
            if (res.error) throw new Error("DB Error: " + res.error);

            // Emit Real-time
            try {
                const sRes = await query('SELECT sapid FROM students WHERE student_id = $1', [studentId]);
                if (sRes.rows.length > 0) {
                    socketService.emitToUser(sRes.rows[0].sapid, 'notification', {
                        title, message, type, link, id: res.rows[0]?.id, created_at: new Date()
                    });
                }
            } catch (e) { console.error("Socket emit failed", e); }

            return {
                id: res.rows[0]?.id,
                rowCount: res.rowCount,
                rows: res.rows,
                command: res.command,
                oid: res.oid
            };
        } catch (err) {
            console.error('[NotificationService] Error sending to student:', err);
            throw err; // Propagate to controller
        }
    },

    /**
     * Broadcast a notification to a group of students based on filters
     * @param {Object} filter - { dept: 'CS', year: '3', division: 'A' }
     */
    broadcast: async ({ title, message, type = 'info', filter = {}, link = null }) => {
        try {
            // Store the broadcast definition for future reference (optional, or just insert for all matches)
            // Strategy: Insert for all matching students directly to ensure they see it in their feed.
            // Hybrid: Insert individual records for reliability and read-tracking.

            // EMIT BROADCAST EVENT
            if (!filter.dept && !filter.year) {
                // Global Broadcast
                socketService.broadcast('notification', {
                    title, message, type, link, created_at: new Date()
                });
            }

            let whereClauses = [];
            let values = [];
            let idx = 1;

            if (filter.dept) {
                whereClauses.push(`dept = $${idx++}`);
                values.push(filter.dept);
            }
            if (filter.year) {
                whereClauses.push(`year = $${idx++}`);
                values.push(filter.year);
            }

            // Construct SELECT query to find targets
            const selectQuery = `SELECT student_id FROM students ${whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : ''}`;

            // This could be heavy for 10k students, but for this scale (100s) it's fine.
            const targetsRes = await query(selectQuery, values);
            const targets = targetsRes.rows;

            console.log(`[NotificationService] Broadcasting to ${targets.length} students. Filter:`, filter);

            if (targets.length === 0) return 0;

            // Batch insert? For now, simple loop or parameterized insert.
            // Using a loop for simplicity, can optimize later.
            for (const student of targets) {
                await query(
                    `INSERT INTO notifications (student_id, title, message, type, link, is_global, target_filter) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [student.student_id, title, message, type, link, true, filter]
                );

                // Emit to each user (or rely on broadcast above if global)
                // If filter exists, better to emit to specific users or rooms in future.
                // For now, if filtered, we emit to user room individually or check logic
                if (filter.dept || filter.year) {
                    // Get SAPID to emit to room user:SAPID
                    // We only selected student_id in targets query (line 56)
                    // Optimization: Select SAPID too
                }
            }

            // FILTERED BROADCAST (If logic supports room based broadcasting in future)
            // For now, let's just make sure we emit to specific users if targeted
            if (filter.dept || filter.year) {
                // Re-query targets with SAPID
                const q = `SELECT sapid FROM students ${whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : ''}`;
                const tRes = await query(q, values);
                tRes.rows.forEach(r => {
                    socketService.emitToUser(r.sapid, 'notification', {
                        title, message, type, link, created_at: new Date()
                    });
                });
            }

            return targets.length;

        } catch (err) {
            console.error('[NotificationService] Error broadcasting:', err);
            return 0;
        }
    },

    /**
     * Check Attendance Risk for a student and alert if needed
     */
    checkAttendanceRisk: async (studentId) => {
        try {
            // Calculate overall attendance
            // (Mock logic: Fetch aggregate from attendance table)
            const res = await query(`
                SELECT 
                    COUNT(*) as total_lectures,
                    SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count
                FROM attendance
                WHERE student_id = $1
            `, [studentId]);

            const { total_lectures, present_count } = res.rows[0];
            if (!total_lectures || total_lectures == 0) return;

            const percentage = (parseInt(present_count) / parseInt(total_lectures)) * 100;

            if (percentage < 75) {
                // Check if we already alerted recently? (Skip for now to keep simple)
                await NotificationService.sendToStudent({
                    studentId,
                    title: 'Attendance Risk Alert 🚨',
                    message: `Your attendance has dropped to ${percentage.toFixed(1)}%. Please attend upcoming classes to avoid debarment.`,
                    type: 'warning',
                    link: '/student/analytics'
                });
            }
        } catch (err) {
            console.error('[NotificationService] Error checking risk:', err);
        }
    },

    /**
     * Notify all users with a specific role (e.g., 'director', 'admin')
     */
    notifyRole: async ({ role, title, message, type = 'info', link = null, filter = {} }) => {
        try {
            let sql = `SELECT student_id FROM students WHERE role = $1`;
            const params = [role];

            // Optional: Filter by Dept for Directors?
            if (filter.dept) {
                sql += ` AND dept = $2`;
                params.push(filter.dept);
            }

            const { rows } = await query(sql, params);

            if (rows.length === 0) {
                console.log(`[NotificationService] No users found with role: ${role}`);
                return;
            }

            console.log(`[NotificationService] Notifying ${rows.length} ${role}s`);

            for (const user of rows) {
                await query(
                    `INSERT INTO notifications (student_id, title, message, type, link, is_global) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [user.student_id, title, message, type, link, false]
                );
            }
        } catch (err) {
            console.error(`[NotificationService] Error notifying role ${role}:`, err);
        }
    }
};
