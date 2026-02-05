// backend/routes/director_events_routes.js
import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * GET /director/events/analytics
 * Real-time aggregations for Director Dashboard
 */
router.get('/analytics', async (req, res) => {
    try {
        if (req.user.role !== 'director' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // 1. GLOBAL OVERVIEW CARDS
        const overviewQ = await query(`
            SELECT
                -- Total Upcoming (Approved & Future)
                COUNT(*) FILTER (WHERE status = 'approved' AND date >= CURRENT_DATE) as upcoming_count,
                
                -- Total Approved Budget (Upcoming)
                COALESCE(SUM(budget_requested) FILTER (WHERE status = 'approved' AND date >= CURRENT_DATE), 0) as approved_budget,
                
                -- Total Events This Month
                COUNT(*) FILTER (WHERE date >= DATE_TRUNC('month', CURRENT_DATE) AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month') as month_count,
                
                -- Pending Approvals
                COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                
                -- Changes Requested
                COUNT(*) FILTER (WHERE status = 'changes_requested') as changes_count,

                -- Total Pending Budget (For Impact Panel)
                COALESCE(SUM(budget_requested) FILTER (WHERE status = 'pending'), 0) as pending_budget

            FROM events
        `);

        // 2. BUDGET BY SCHOOL
        const budgetBySchoolQ = await query(`
            SELECT school, COALESCE(SUM(budget_requested), 0) as total
            FROM events
            WHERE status = 'approved' AND date >= DATE_TRUNC('year', CURRENT_DATE) -- SY aggregation usually
            GROUP BY school
            ORDER BY total DESC
        `);

        // 3. BUDGET BY MONTH (Trend)
        const budgetByMonthQ = await query(`
            SELECT to_char(date, 'Mon') as month, COALESCE(SUM(budget_requested), 0) as total
            FROM events
            WHERE status = 'approved' AND date >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', date), to_char(date, 'Mon')
            ORDER BY DATE_TRUNC('month', date) ASC
        `);

        // 4. EVENTS BY TYPE (If data exists)
        const eventsByTypeQ = await query(`
            SELECT event_type, COUNT(*) as count, COALESCE(SUM(budget_requested), 0) as budget
            FROM events
            WHERE date >= CURRENT_DATE - INTERVAL '1 year'
            GROUP BY event_type
        `);

        // 5. UPCOMING LIST
        const upcomingQ = await query(`
            SELECT event_id, title, school, date, time, venue, budget_requested, status, created_by
            FROM events
            WHERE date >= CURRENT_DATE
            ORDER BY date ASC
            LIMIT 10
        `);

        res.json({
            overview: overviewQ.rows[0],
            by_school: budgetBySchoolQ.rows,
            by_month: budgetByMonthQ.rows,
            by_type: eventsByTypeQ.rows,
            upcoming: upcomingQ.rows
        });

    } catch (e) {
        console.error("Director Analytics Error:", e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
