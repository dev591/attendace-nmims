import express from 'express';
import { query } from '../db.js';
import { requireDirector, authenticateToken } from '../middleware/auth.js';
import { recomputeAnalyticsForStudent } from '../lib/analytics.js';
import { NotificationService } from '../services/NotificationService.js';

const router = express.Router();

// Middleware: Authenticate first, then check Director Role
router.use(authenticateToken, requireDirector);

// 1. GET /director/students
// Filters: dept (School), year, search
// Strict filtering implementation
router.get('/students', async (req, res) => {
    try {
        const { search, dept, year } = req.query;
        // Optimization: Default to 10 for browsing, 50 for searching to reduce load
        const limit = req.query.limit ? parseInt(req.query.limit) : (search ? 50 : 10);
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;

        console.log(`[Director API] Fetching students. Dept: ${dept}, Year: ${year}, Search: '${search || ''}', Limit: ${limit}`);

        let sql = `
            SELECT 
                st.student_id, 
                st.sapid, 
                st.name, 
                st.email, 
                COALESCE(st.program, st.dept) as program, 
                st.dept, 
                COALESCE(st.year::text, 'N/A') as year, 
                st.role,
                CASE 
                    WHEN EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = st.student_id) THEN 'ENROLLED' 
                    ELSE 'NO_SUBJECTS_CONFIGURED' 
                END as enrollment_status
            FROM students st
            WHERE st.role = 'student'
        `;
        const params = [];
        let pIdx = 1;

        // Strict Filters
        if (dept && dept !== 'All') {
            sql += ` AND dept = $${pIdx++}`;
            params.push(dept);
        }

        if (year && year !== 'All') {
            sql += ` AND year = $${pIdx++}`;
            params.push(parseInt(year));
        }

        if (search) {
            sql += ` AND (sapid ILIKE $${pIdx} OR name ILIKE $${pIdx})`;
            params.push(`%${search}%`);
            pIdx++;
        }

        sql += ` ORDER BY name ASC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
        params.push(limit, offset);

        const { rows } = await query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Director Students Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. GET /director/students/defaulters
// Returns students with distinct low attendance
router.get('/students/defaulters', async (req, res) => {
    try {
        const { dept } = req.query;
        const threshold = 75;

        const deptFilter = dept && dept !== 'All' ? 'AND st.dept = $1' : '';
        const params = dept && dept !== 'All' ? [threshold, dept] : [threshold];

        const sql = `
            WITH stats AS (
                SELECT 
                    e.student_id,
                    COUNT(s.session_id) as total_sessions,
                    COUNT(CASE WHEN a.present THEN 1 END) as attended_sessions
                FROM enrollments e
                JOIN sessions s ON e.subject_id = s.subject_id
                LEFT JOIN attendance a ON s.session_id = a.session_id AND e.student_id = a.student_id
                JOIN students st ON e.student_id = st.student_id
                WHERE s.status = 'conducted' ${deptFilter}
                GROUP BY e.student_id
            )
            SELECT 
                st.sapid, st.name, st.dept, st.year, st.phone, st.parent_phone,
                COALESCE(stats.total_sessions, 0) as conducted,
                COALESCE(stats.attended_sessions, 0) as attended,
                CASE 
                    WHEN COALESCE(stats.total_sessions, 0) = 0 THEN 0 
                    ELSE ROUND((stats.attended_sessions::numeric / stats.total_sessions) * 100, 1) 
                END as pct
            FROM students st
            JOIN stats ON st.student_id = stats.student_id
            WHERE 
                (CASE 
                    WHEN COALESCE(stats.total_sessions, 0) = 0 THEN 0 
                    ELSE (stats.attended_sessions::numeric / stats.total_sessions) * 100 
                END) < $1
            ORDER BY pct ASC
            LIMIT 200
        `;

        const { rows } = await query(sql, params);
        res.json(rows);

    } catch (err) {
        console.error("Defaulters Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 3. GET /director/student/:sapid
// Full 360 Profile: Contact, Marks, Projects, Analytics
router.get('/student/:sapid', async (req, res) => {
    try {
        const { sapid } = req.params;

        // 1. Basic Info
        const studentRes = await query("SELECT student_id, sapid, name, email, dept, program, year, phone, parent_phone, joining_year FROM students WHERE sapid = $1", [sapid]);
        if (studentRes.rows.length === 0) return res.status(404).json({ error: "Student not found" });
        const student = studentRes.rows[0];

        // 2. Analytics
        const analytics = await recomputeAnalyticsForStudent(sapid);

        // 3. ICA Marks
        const marksRes = await query(
            "SELECT subject_code, test_name, marks_obtained, total_marks FROM ica_marks WHERE student_id = $1 ORDER BY subject_code, test_name",
            [student.student_id]
        );

        // 4. Projects
        const projectsRes = await query(
            "SELECT title, description, link, status, submitted_at FROM student_projects WHERE student_id = $1 ORDER BY submitted_at DESC",
            [student.student_id]
        );

        res.json({
            profile: student,
            analytics: analytics,
            ica_marks: marksRes.rows,
            projects: projectsRes.rows
        });
    } catch (err) {
        console.error("Director Student Profile Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 3.5 POST /director/notify (Targeted Notification)
router.post('/notify', async (req, res) => {
    try {
        const { sapid, message, type } = req.body;

        // Resolve Student ID
        const sRes = await query("SELECT student_id FROM students WHERE sapid = $1", [sapid]);
        if (sRes.rows.length === 0) return res.status(404).json({ error: "Student not found" });
        const student_id = sRes.rows[0].student_id;

        await query(
            "INSERT INTO notifications (student_id, message, type, created_by) VALUES ($1, $2, $3, $4)",
            [student_id, message, type || 'info', req.user.sapid]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Notify Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 4. POST /director/announcements
router.post('/announcements', async (req, res) => {
    try {
        const { title, message, target_group, target_value } = req.body;
        // target_group: 'all', 'school', 'student'
        // target_value: 'STME', '700...', null

        const config = {
            scope: target_group,
            value: target_value
        };

        await query(
            "INSERT INTO announcements (title, message, target_group, target_value, created_by) VALUES ($1, $2, $3, $4, $5)",
            [title, message, target_group, target_value, req.user.sapid]
        );

        // TRIGGER NOTIFICATIONS
        // (NotificationService is imported at top level now)

        if (target_group === 'all') {
            await NotificationService.broadcast({
                title: `Announcement: ${title}`,
                message: message,
                type: 'info',
                filter: {} // All students
            });
        } else if (target_group === 'school' && target_value) {
            await NotificationService.broadcast({
                title: `Department Announcement: ${title}`,
                message: message,
                type: 'info',
                filter: { dept: target_value }
            });
        } else if (target_group === 'student' && target_value) {
            // target_value is sapid here usually? or student_id? 
            // In router line 166 (notify), it uses sapid. Let's assume sapid.
            // Need to resolve ID first if using NotificationService.sendToStudent which typically takes studentId (UUID) or we check service.

            // Resolve SAPID to UUID
            const sRes = await query("SELECT student_id FROM students WHERE sapid = $1", [target_value]);
            if (sRes.rows.length > 0) {
                await NotificationService.sendToStudent({
                    studentId: sRes.rows[0].student_id,
                    title: `Personal Announcement: ${title}`,
                    message: message,
                    type: 'info'
                });
            }
        }

        res.json({ success: true, message: "Announcement sent and notifications dispatched." });
    } catch (err) {
        console.error("Announcement Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 5. GET /director/stats (Dashboard Metrics)
router.get('/stats', async (req, res) => {
    try {
        const { dept } = req.query;

        const deptFilter = dept && dept !== 'All' ? 'AND st.dept = $1' : '';
        const params = dept && dept !== 'All' ? [dept] : [];

        // KPI: Total Students
        const totalStudentsRes = await query(`SELECT COUNT(*) FROM students st WHERE role = 'student' ${deptFilter}`, params);

        // KPI: Active Defaulters
        // Using simplified quick count or cached logic could be faster, but strictly:
        const atRiskRes = await query(`
            WITH stats AS (
                SELECT 
                    e.student_id,
                    COUNT(s.session_id) as total,
                    COUNT(CASE WHEN a.present THEN 1 END) as attended
                FROM enrollments e
                JOIN sessions s ON e.subject_id = s.subject_id
                LEFT JOIN attendance a ON s.session_id = a.session_id AND e.student_id = a.student_id
                JOIN students st ON e.student_id = st.student_id
                WHERE s.status = 'conducted' ${deptFilter}
                GROUP BY e.student_id
            )
            SELECT COUNT(*) 
            FROM stats 
            WHERE (attended::numeric / NULLIF(total,0)) * 100 < 75
        `, params);

        // KPI: Live Pulse (Active Classes Right Now)
        // Ignoring dept filter for Pulse usually, but let's apply if requested? 
        // Sessions table has subject_id, need to join course/dept.
        // For simplicity, Pulse is usually global or we can filter.
        const pulseRes = await query(`
            SELECT count(*) 
            FROM sessions s
            JOIN subjects sub ON s.subject_id = sub.subject_id
            -- JOIN course_subjects cs ... to get dept? 
            -- For MVP, just count conducted today or "active now" logic
            WHERE s.date = CURRENT_DATE 
            AND s.start_time <= CURRENT_TIME 
            AND s.end_time >= CURRENT_TIME
        `);

        // CHART: Dept Distribution
        const distRes = await query(`
            SELECT dept as name, COUNT(*) as value
            FROM students
            WHERE role = 'student'
            GROUP BY dept
        `);

        // CHART: Trends (Live Data from Attendance)
        // Aggregating last 6 months of attendance
        const trendsRes = await query(`
            SELECT 
                TO_CHAR(s.date, 'Mon') as name, 
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN a.present THEN 1 END) as attended,
                CASE 
                    WHEN COUNT(*) = 0 THEN 0
                    ELSE ROUND((COUNT(CASE WHEN a.present THEN 1 END)::numeric / COUNT(*)) * 100, 1)
                END as value
            FROM sessions s
            JOIN attendance a ON s.session_id = a.session_id
            WHERE s.date > CURRENT_DATE - INTERVAL '6 months'
            GROUP BY TO_CHAR(s.date, 'Mon'), DATE_TRUNC('month', s.date)
            ORDER BY DATE_TRUNC('month', s.date)
        `);

        // KPI: Faculty Count
        const facultyRes = await query("SELECT COUNT(*) FROM students WHERE role = 'faculty'");

        res.json({
            kpi: {
                students: parseInt(totalStudentsRes.rows[0]?.count || 0),
                at_risk: parseInt(atRiskRes.rows[0]?.count || 0),
                live_classes: parseInt(pulseRes.rows[0]?.count || 0),
                faculty: parseInt(facultyRes.rows[0]?.count || 0)
            },
            distribution: distRes.rows,
            trends: trendsRes.rows.length > 0 ? trendsRes.rows : [{ name: 'No Data', value: 0 }]
        });

    } catch (err) {
        console.error("Director Stats Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 6. GET /director/faculty-load (Top 5 by Scheduled Sessions)
router.get('/faculty-load', async (req, res) => {
    try {
        // Excel Source of Truth: sessions + course_subjects (Faculty Map)
        // Join sessions -> course_subjects on subject_id
        const result = await query(`
            SELECT 
                cs.faculty_name, 
                COUNT(s.session_id) as total_sessions
            FROM sessions s
            JOIN course_subjects cs ON s.subject_id = cs.subject_id
            WHERE cs.faculty_name IS NOT NULL
            GROUP BY cs.faculty_name
            ORDER BY total_sessions DESC
            LIMIT 5
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Faculty Load Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 7. GET /director/daily-ops (Timetable Adherence)
router.get('/daily-ops', async (req, res) => {
    try {
        // Source of Truth: Timetable (sessions table)
        const result = await query(`
            SELECT 
                COUNT(*) as scheduled,
                COUNT(CASE WHEN status = 'conducted' THEN 1 END) as conducted,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
            FROM sessions 
            WHERE date = CURRENT_DATE
        `);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Daily Ops Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 6. Strategic Heatmaps
router.get('/heatmaps', authenticateToken, async (req, res) => {
    try {
        // Aggregate avg attendance by Dept + Year
        // Also count "At Risk" (avg < 75%)
        const q = `
            SELECT 
                s.dept, 
                s.year,
                COUNT(s.student_id) as student_count,
                ROUND(AVG(
                    CASE 
                        WHEN stat.total_sessions > 0 THEN (stat.present_sessions::decimal / stat.total_sessions) * 100 
                        ELSE 0 
                    END
                ), 1) as avg_attendance,
                COUNT(CASE 
                    WHEN (stat.present_sessions::decimal / NULLIF(stat.total_sessions, 0)) < 0.75 THEN 1 
                END) as risk_count
            FROM students s
            LEFT JOIN (
                SELECT student_id, COUNT(*) as total_sessions, COUNT(CASE WHEN present THEN 1 END) as present_sessions
                FROM attendance
                GROUP BY student_id
            ) stat ON s.student_id = stat.student_id
            WHERE s.role = 'student'
            GROUP BY s.dept, s.year
            ORDER BY s.dept, s.year
        `;

        const { rows } = await query(q);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Heatmap generation failed" });
    }
});

// 8. GET /director/faculty/list (Directory)
router.get('/faculty/list', async (req, res) => {
    try {
        const { search } = req.query;
        let sql = `
            SELECT 
                student_id, sapid, name, email, dept, designation, 
                phone, role, joining_year
            FROM students 
            WHERE role = 'faculty'
        `;
        const params = [];

        if (search) {
            sql += ` AND (name ILIKE $1 OR sapid ILIKE $1)`;
            params.push(`%${search}%`);
        }

        sql += ` ORDER BY name ASC`;

        const { rows } = await query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Faculty List Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
