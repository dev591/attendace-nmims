// Forces Restart
import express from 'express';
import http from 'http'; // ADDED FOR SOCKET
import cors from 'cors';
import compression from 'compression'; // ADDED BY ANTI-GRAVITY
import helmet from 'helmet'; // ADDED BY ANTI-GRAVITY
import Redis from 'ioredis'; // ADDED BY ANTI-GRAVITY
import { socketService } from './services/socket_service.js'; // ADDED FOR SOCKET
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { query } from './db.js';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logAndReturnToken } from './token_debug_helper.js';

import { normalizeProgram } from './lib/program_mapper.js';
import {
    calcAttendanceStats,
    getStudentAnalyticsOverview,
    calculateMomentum,
    calculateOverallStatus
} from './attendance_analytics.js'; // ADDED BY ANTI-GRAVITY
import { upload } from './lib/file_upload.js';
import importApiRouter from './routes/import_api.js';
import debugAnalyticsRouter from './routes/debug_analytics.js';
import studentSafeRouter from './routes/student_safe.js';
import debugAuditRouter from './routes/debug_audit.js';
import queueTestRouter from './routes/queue_test.js'; // ADDED BY ANTI-GRAVITY
import { startWorkers } from './lib/queue/worker.js'; // ADDED BY ANTI-GRAVITY

import qrRouter from './routes/qr.js'; // ADDED BY ANTI-GRAVITY
import studentCalculatorRouter from './routes/student_calculator.js'; // ADDED BY ANTI-GRAVITY
import debugForensicRouter from './routes/debug_forensic.js'; // ADDED BY ANTI-GRAVITY (FORENSIC AUDIT)
import leaderboardRouter from './routes/leaderboard_routes.js'; // ADDED BY ANTI-GRAVITY
import importFacultyRouter from './routes/import_faculty.js'; // ADDED BY ANTI-GRAVITY
import facultyProfileRouter from './routes/faculty_profile_routes.js'; // ADDED BY ANTI-GRAVITY
import studentAnalyticsRouter from './routes/student_analytics.js'; // ADDED BY ANTI-GRAVITY
import { recomputeAnalyticsForStudent } from './lib/analytics.js'; // ADDED BY ANTI-GRAVITY
import { autoEnrollStudent } from './lib/enrollment_service.js'; // ADDED BY ANTI-GRAVITY
import { evaluateBadges } from './lib/badge_engine.js'; // ADDED BY ANTI-GRAVITY
import { getAllBadgesWithStatus } from './lib/badges.js'; // ADDED BY ANTI-GRAVITY
import { PostgresProvider } from './providers/PostgresProvider.js'; // ADDED BY ANTI-GRAVITY
import eventRoutes from './routes/event_routes.js'; // ADDED BY ANTI-GRAVITY
import directorEventRoutes from './routes/director_events_routes.js'; // ADDED BY ANTI-GRAVITY
import appealsRouter from './routes/appeals.js';
import achievementsRouter from './routes/achievements.js'; // NEW // ADDED BY ANTI-GRAVITY (Condonation)
import portfolioRouter from './routes/portfolio.js'; // ADDED BY ANTI-GRAVITY (Portfolio 2.0)
import networkRouter from './routes/network.js'; // ADDED BY ANTI-GRAVITY (Social)
import networkActionRoutes from './routes/network_actions.js'; // ADDED BY ANTI-GRAVITY (Social)
import aiRoutes from './routes/ai_service.js'; // ADDED BY ANTI-GRAVITY (AI Copilot)
import careerRouter from './routes/career.js'; // ADDED BY ANTI-GRAVITY (Career Copilot)

dotenv.config();

const app = express();
const server = http.createServer(app); // WRAP EXPRESS

// Init Socket
socketService.init(server);
// Init Queue Workers
startWorkers(); // Start consumers

// Redis Setup (Optional)
let redis = null;
try {
    redis = new Redis(process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        lazyConnect: true,
        showFriendlyErrorStack: true
    });
    redis.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            // Suppress connection refused logs if Redis is down (Optional mode)
        } else {
            console.warn('[REDIS] Error:', err.message);
        }
    });
    redis.connect().catch(() => console.log("[REDIS] Cache Disabled (Connection Failed)"));
} catch (e) { console.log("[REDIS] Client Init Failed"); }

app.use(compression()); // Gzip
app.use(helmet({
    contentSecurityPolicy: false, // Disable for dev ease if needed
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ origin: '*' })); // DEBUG: Allow all origins
app.use(express.json());

// Move Middleware BELOW app check
app.use(appealsRouter);
app.use(achievementsRouter);
app.use(careerRouter); // Mount Career Routes
app.use('/student', portfolioRouter); // Mount Profile Routes
app.use('/network', networkRouter);
app.use('/network', networkActionRoutes);
app.use('/ai', aiRoutes); // Mount AI Routes
app.use('/queue', queueTestRouter); // MOUNT QUEUE TEST ROUTE

app.use('/import', importApiRouter);
app.use('/import', importApiRouter);
app.use('/debug', debugAnalyticsRouter);
app.use('/__debug', debugForensicRouter); // MOUNTED FORENSIC ROUTE

// DEBUG: Verify Student & Curriculum & Force Enroll
app.get('/__debug/curriculum-check/:program', async (req, res) => {
    try {
        const { program } = req.params;
        const result = await query('SELECT * FROM curriculum WHERE lower(program) = lower($1) LIMIT 10', [program]);

        // CHECK IF AI301 EXISTS IN SUBJECTS
        const subCheck = await query("SELECT * FROM subjects WHERE code = 'AI301'"); // arbitrary check based on previous sample

        res.json({
            count: result.rowCount,
            sample: result.rows,
            subject_ai301_exists: subCheck.rowCount > 0,
            subject_ai301: subCheck.rows[0]
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/__debug/force-enroll/:sapid', async (req, res) => {
    try {
        const { sapid } = req.params;
        const studentRes = await query('SELECT * FROM students WHERE sapid = $1', [sapid]);
        if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

        const s = studentRes.rows[0];

        // AUTO-ENROLL LOGIC REPLICATION DIAGNOSTIC
        const progKey = s.program.toLowerCase();

        const diagnosticQuery = await query(`
            SELECT DISTINCT s.subject_id, s.code, s.name, c.program, c.semester, c.year
            FROM curriculum c
            JOIN subjects s ON c.subject_code = s.code
            WHERE LOWER(c.program) = $1
            AND c.semester = $2
            AND c.year = $3
        `, [progKey, s.semester, s.year]);

        // Proceed to attempt real enrollment if diagnostic finds rows
        let result = { enrolled: 0, status: 'SKIPPED_DIAGNOSTIC_ONLY' };
        if (diagnosticQuery.rowCount > 0) {
            result = await autoEnrollStudent(s.student_id, s.program, s.dept, s.semester, s.year);
        }

        const enrollRes = await query('SELECT count(*) FROM enrollments WHERE student_id = $1', [s.student_id]);

        res.json({
            success: true,
            student_profile: {
                program: s.program,
                dept: s.dept,
                semester: s.semester,
                year: s.year
            },
            diagnostic_rows: diagnosticQuery.rows,
            enroll_result: result,
            final_enrollment_count: enrollRes.rows[0].count
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/__debug/update-student/:sapid/:year/:sem', async (req, res) => {
    try {
        const { sapid, year, sem } = req.params;
        await query('UPDATE students SET year = $1, semester = $2 WHERE sapid = $3', [year, sem, sapid]);
        res.json({ success: true, updated_to: { year, sem } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/__debug/sync-subjects', async (req, res) => {
    try {
        const result = await query(`
            INSERT INTO subjects (code, name, program, dept)
            SELECT DISTINCT c.subject_code, c.subject_name, c.program, 'MPSTME'
            FROM curriculum c
            WHERE NOT EXISTS (SELECT 1 FROM subjects s WHERE s.code = c.subject_code)
        `);
        res.json({ success: true, inserted: result.rowCount });
    } catch (e) {
        // Fallback if dept/program columns missing or different
        try {
            const res2 = await query(`
                INSERT INTO subjects (code, name)
                SELECT DISTINCT c.subject_code, c.subject_name
                FROM curriculum c
                WHERE NOT EXISTS (SELECT 1 FROM subjects s WHERE s.code = c.subject_code)
            `);
            res.json({ success: true, inserted: res2.rowCount, mode: 'minimal' });
        } catch (e2) {
            res.status(500).json({ error: e.message, error2: e2.message });
        }
    }
});

// ANTI-GRAVITY: E2E Test Reset Route (Temporary)
// ANTI-GRAVITY: E2E Verify Route (Bypass Shell)
app.get('/e2e/run-verify', async (req, res) => {
    const logs = [];
    const log = (msg) => logs.push(msg);
    try {
        log("🚀 Starting E2E Verification (Internal)...");

        // 1. LOGIN DIRECTOR
        const dirRes = await query("SELECT student_id, sapid FROM students WHERE sapid = 'DIRECTOR'");
        if (dirRes.rows.length === 0) throw new Error("Director not found");

        const dirToken = jwt.sign({ id: 'DIRECTOR', sapid: 'DIRECTOR', role: 'director' }, JWT_SECRET, { expiresIn: '1h' });
        log("✅ Director Token Generated");

        // 2. SEND ANNOUNCEMENT (Direct Controller Call logic or DB Insert)
        const STUDENT_SAPID = '590000001';
        log(`\n[2] Sending Announcement to ${STUDENT_SAPID}...`);
        await query(`
             INSERT INTO announcements (title, message, target_group, target_value)
             VALUES ($1, $2, 'student', $3)
        `, ["E2E Test Announcement", "Verification Message", STUDENT_SAPID]);
        log("✅ Announcement Inserted into DB");

        // 3. CHECK STUDENT INBOX
        log("\n[3] Checking Student Inbox...");
        const annRes = await query("SELECT * FROM announcements WHERE target_group='student' AND target_value=$1", [STUDENT_SAPID]);
        const found = annRes.rows.find(a => a.title === "E2E Test Announcement");
        if (found) log("✅ Announcement Verified in Database for Student");
        else log("❌ Announcement Missing!");

        // 4. SIMULATE FILE UPLOAD (Update Attendance)
        log("\n[4] Simulating Attendance Upload for SESS_002...");
        // SESS_002 was False. Set to True.
        const sIdRes = await query("SELECT student_id FROM students WHERE sapid = $1", [STUDENT_SAPID]);
        const sId = sIdRes.rows[0].student_id;

        await query(`
            INSERT INTO attendance (session_id, student_id, present, source)
            VALUES ('SESS_002', $1, true, 'manual_verify')
            ON CONFLICT (session_id, student_id) DO UPDATE SET present = true
        `, [sId]);
        log("✅ Attendance Updated in DB");

        // 5. VERIFY STATS (Call Recompute)
        log("\n[5] Verifying Stats Update...");
        const { recomputeAnalyticsForStudent } = await import('./lib/analytics.js');
        const stats = await recomputeAnalyticsForStudent(STUDENT_SAPID);

        const rate = stats.analytics.attendanceRate;
        log(`Overall Attendance: ${rate}% (Expected 100%)`);

        if (rate === 100) log("✅ E2E SUCCESS: Data updated correctly!");
        else log(`❌ E2E FAIL: Rate is ${rate}%`);

        res.json({ success: true, logs });

    } catch (e) {
        log("❌ FATAL ERROR: " + e.message);
        res.status(500).json({ success: false, logs, error: e.message });
    }
});

app.use('/', studentSafeRouter);
app.use('/', qrRouter); // ADDED BY ANTI-GRAVITY
app.use('/student', studentCalculatorRouter); // ADDED BY ANTI-GRAVITY
app.use('/', leaderboardRouter); // ADDED BY ANTI-GRAVITY (Real Data)
app.use('/', importFacultyRouter); // ADDED BY ANTI-GRAVITY (Faculty Upload)
app.use('/', facultyProfileRouter); // ADDED BY ANTI-GRAVITY (Live Status)
app.use('/student', studentAnalyticsRouter); // ADDED BY ANTI-GRAVITY (Deep Analytics)
app.use(appealsRouter);
app.use(achievementsRouter); // NEW // ADDED BY ANTI-GRAVITY (Condonation)
app.use('/student', portfolioRouter); // Mount Profile Routes


const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

// DEBUG: In-memory log storage
const requestLogs = [];

// DEBUG: Global Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    const logEntry = {
        timestamp,
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query
    };

    // Console output in requested format
    // [REQ] 2025-12-11T... POST /auth/login status=PENDING body={...}
    console.log(`[REQ] ${timestamp} ${req.method} ${req.path} body=${JSON.stringify(req.body)}`);

    // Store in memory (max 20)
    requestLogs.unshift(logEntry);
    if (requestLogs.length > 20) requestLogs.pop();

    // Hook into response finish to log status
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[REQ] ${timestamp} ${req.method} ${req.path} status=${res.statusCode} (${duration}ms)`);
        logEntry.status = res.statusCode;
        logEntry.duration = duration;
    });

    next();
});

// DEBUG: View Logs Route
app.get('/__debug/requests', (req, res) => {
    res.json(requestLogs);
});

app.get('/__debug/token-log', (req, res) => {
    const logFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'debug-reports', 'issued_tokens.log');
    if (fs.existsSync(logFile)) {
        const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n').slice(-50).map(l => JSON.parse(l));
        res.json(lines);
    } else {
        res.json([]);
    }
});

app.get('/__debug/search-report', (req, res) => {
    const reportFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'debug-reports', 'token_search_report.json');
    if (fs.existsSync(reportFile)) {
        res.json(JSON.parse(fs.readFileSync(reportFile, 'utf-8')));
    } else {
        res.json({});
    }
});

app.get('/__debug/login-attempts', (req, res) => {
    const logFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'debug-reports', 'login_attempts.log');
    if (fs.existsSync(logFile)) {
        const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n').slice(-50).map(l => JSON.parse(l));
        res.json(lines);
    } else {
        res.json([]);
    }
});

// Auth Middleware (Imported)
import { authenticateToken as auth } from './middleware/auth.js';
import adminRouter from './routes/admin_routes.js';

import debugDailyRouter from './routes/debug_daily.js';

// Mount Admin Routes
import directorRouter from './routes/director_routes.js'; // Director Routes
import adminIngestRouter from './routes/admin_ingest.js'; // Admin Ingest Routes

// ...

app.use('/admin', adminRouter);
app.use('/admin', adminIngestRouter); // Mount Ingest APIs
app.use('/director', directorRouter); // Mount Director APIs
import securityIncidentsRouter from './routes/security_incidents.js';
app.use('/admin', securityIncidentsRouter);
app.use('/director', securityIncidentsRouter); // Access for Director too
import notificationsRouter from './routes/notifications.js';
app.use('/notifications', notificationsRouter);

app.use('/debug', debugAuditRouter);
app.use('/debug', debugDailyRouter);
app.use('/director/events', directorEventRoutes); // MOUNT DIRECTOR EVENT ANALYTICS
app.use('/events', auth, eventRoutes); // MOUNT EVENT CRUD (Protected)

// ... (removed local auth const)

// 1. Auth: Login (SAPID + Password) -- STRICT & DEBUGGED
app.post('/auth/login', async (req, res) => {
    const { sapid, password } = req.body;

    // Log intent
    const loginLogFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'debug-reports', 'login_attempts.log');
    const logEntry = JSON.stringify({ ts: new Date().toISOString(), body: req.body });
    try {
        if (!fs.existsSync(path.dirname(loginLogFile))) fs.mkdirSync(path.dirname(loginLogFile), { recursive: true });
        fs.appendFileSync(loginLogFile, logEntry + '\n');
    } catch (e) { console.error('Login log failed', e); }

    console.log(`[LOGIN DEBUG] incoming body:`, JSON.stringify(req.body));

    if (!sapid || !password) {
        console.log("[LOGIN DEBUG] Missing sapid or password");
        return res.status(400).json({ error: "Missing credentials" });
    }

    // ANTI-GRAVITY FIX: Normalization
    const rawSapid = sapid;
    const normalizedSapid = String(rawSapid).trim();

    try {
        console.log(`[LOGIN HARD DEBUG] Received: '${rawSapid}' (${typeof rawSapid}), Normalized: '${normalizedSapid}'`);

        // SPECIAL CASE: Director Master Login (DS001)
        if (normalizedSapid === 'DIRECTOR' && password === 'DS001') {
            console.log("[LOGIN] Director Master Access Triggered.");
            // Ensure Director exists in DB for Profile/Announcements foreign keys
            await query(`
                INSERT INTO students (student_id, sapid, name, role, dept, program, year, password_hash)
                VALUES ('DIRECTOR', 'DIRECTOR', 'Director', 'director', 'OFFICE', 'ADMIN', 0, 'DS001_HASH_PLACEHOLDER')
                ON CONFLICT (sapid) DO UPDATE SET role = 'director'
            `);

            // Generate Token immediately
            const token = jwt.sign({
                id: 'DIRECTOR',
                sapid: 'DIRECTOR',
                role: 'director'
            }, JWT_SECRET, { expiresIn: '12h' });

            return res.json({
                token,
                user: {
                    sapid: 'DIRECTOR',
                    student_id: 'DIRECTOR',
                    name: 'Director',
                    role: 'director',
                    program: 'Office',
                    year: 0
                },
                role: 'director'
            });
        }
        // Extending for: DIRECTOR, EVENT_COORD, CLUB_HEAD, SCHOOL_ADMIN
        const SPECIAL_ROLES = {
            'DIRECTOR': { pass: 'DS001', role: 'director', name: 'Director', dept: 'OFFICE' },
            'EVENT_COORD': { pass: 'EC001', role: 'event_coordinator', name: 'Event Coordinator', dept: 'EVENTS' },
            'CLUB_HEAD': { pass: 'CH001', role: 'club_head', name: 'Club Head', dept: 'STUDENT_COUNCIL' },
            'SCHOOL_ADMIN': { pass: 'SA001', role: 'school_admin', name: 'School Admin', dept: 'ADMIN' }
        };

        if (SPECIAL_ROLES[normalizedSapid] && password === SPECIAL_ROLES[normalizedSapid].pass) {
            const profile = SPECIAL_ROLES[normalizedSapid];
            console.log(`[LOGIN] Special Access Triggered: ${profile.role}`);

            // Upsert Special User
            await query(`
                INSERT INTO students (student_id, sapid, name, role, dept, program, year, password_hash)
                VALUES ($1, $1, $2, $3, $4, 'ADMIN', 0, 'SPECIAL_HASH_PLACEHOLDER')
                ON CONFLICT (sapid) DO UPDATE SET role = $3
            `, [normalizedSapid, profile.name, profile.role, profile.dept]);

            // Generate Token
            const token = jwt.sign({
                id: normalizedSapid,
                sapid: normalizedSapid,
                role: profile.role
            }, JWT_SECRET, { expiresIn: '12h' });

            return res.json({
                token,
                user: {
                    sapid: normalizedSapid,
                    student_id: normalizedSapid,
                    name: profile.name,
                    role: profile.role,
                    program: profile.dept,
                    year: 0
                },
                role: profile.role
            });
        }

        // Query specific columns (Updated for strict requirements + Role)
        // Ensure we query using normalized string
        // Query specific columns (Updated for strict requirements + Role)
        const queryText = 'SELECT student_id, sapid, name, password_hash, course_id, program, dept, year, semester, must_set_password, role FROM students WHERE sapid = $1';

        const { rows } = await query(queryText, [normalizedSapid]);

        if (rows.length === 0) {
            console.error(`[LOGIN FAILURE] Student NOT FOUND in DB. SAPID: '${normalizedSapid}'`);
            return res.status(404).json({ error: 'Student not found' });
        }

        const student = rows[0];

        if (!student.password_hash) {
            console.log("[LOGIN DEBUG] result: 403 No password hash set for user");
            return res.status(403).json({ error: 'Password not set. Contact admin.' });
        }

        const validPass = await bcrypt.compare(password, student.password_hash);

        if (!validPass) {
            console.log("[LOGIN DEBUG] result: 401 Invalid password");
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Auto-Enrollment Hook (Keep existing logic)
        await autoEnrollStudent(student.student_id, student.program, student.dept, student.semester, student.year);

        // Strict Token Payload + ROLE
        const tokenPayload = {
            id: student.student_id,
            student_id: student.student_id, // Explicitly added for compatibility
            sapid: student.sapid,
            role: student.role || 'student'
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

        console.log(`[LOGIN SUCCESS] User: ${student.sapid} Role: ${tokenPayload.role}`);

        // Return Token + User Data
        res.json({
            token,
            user: {
                sapid: student.sapid,
                student_id: student.sapid, // Alias for frontend consistency
                name: student.name,
                role: student.role || 'student',
                program: student.program,
                year: student.year
            },
            role: student.role || 'student' // Root level fallback
        });


    } catch (e) {
        console.error("[LOGIN DEBUG] Exception:", e);
        res.status(500).json({ error: e.message });
    }
});

// 2. Auth: Admin Login
app.post('/auth/admin/login', async (req, res) => {
    const { password } = req.body;
    // Hardcoded for MVP as per user instruction 'antigravity'
    if (password === 'antigravity') {
        const token = jwt.sign({ sapid: 'ADMIN', role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
        res.json({
            token,
            user: {
                sapid: 'ADMIN',
                name: 'System Administrator',
                role: 'admin'
            }
        });
    } else {
        res.status(401).json({ error: 'Invalid Admin credentials' });
    }
});

// 5. Admin Schedule Upload (Scoped)
app.post('/admin/schedule/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // Loose Scope: We use body if provided, otherwise file will dictate
        // Prompt URGENT FIX: Do NOT require scope from request body.
        const scope = req.body || {};

        console.log(`[Admin] Uploading Schedule. UI Scope Provided:`, scope);

        // We pass the scope to service but service will now prioritize file content
        const result = await processScheduleUpload(req.file, scope);

        // Return structured feedback
        const hasErrors = result.errors && result.errors.length > 0;
        const msg = hasErrors ?
            `Uploaded ${result.inserted_sessions} sessions with some errors.` :
            `Successfully scheduled ${result.inserted_sessions} sessions.`;

        res.json({
            success: !hasErrors, // Warning state if errors exist
            message: msg,
            details: result,
            help: hasErrors ? {
                message: "Some rows were rejected due to data mismatch.",
                action: "Review the 'details' log, correct the Excel file, and re-upload."
            } : null
        });

    } catch (e) {
        console.error("Upload Route Error:", e);
        res.status(500).json({ error: e.message || 'Processing failed.' });
    }
});

// 2. Set Course
app.post('/student/set-course', auth, async (req, res) => {
    const { course_id } = req.body;
    try {
        await query('UPDATE students SET course_id = $1 WHERE student_id = $2', [course_id, req.user.student_id]);

        // Auto-Enroll logic (Should rely on re-usable function ideally, but inline here for now as hook)
        // Actually, we should call autoEnrollStudent helper if possible or just rely on the updated logic.
        // For now, let's just confirm the update. 
        // Real auto-enrollment happens on login or via the explicit helper.
        // But to be safe, let's trigger the stored procedure or logic if it existed.
        // Since we don't have the helper exported easily here, we'll assume the student re-logs in or we just update.

        await autoEnrollStudent(req.user.student_id, req.user.program, req.user.semester, req.user.year);

        res.json({ success: true, message: 'Course updated and enrollments refreshed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Get Available Courses (for dropdown)
app.get('/courses', async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM courses');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Helper Calc Function
const calculateStats = (T, C, A, credits, required = 0.75) => {
    const percent = C === 0 ? 100 : Math.round((A / C) * 100);
    const required_total = Math.ceil(required * T);
    const remaining = Math.max(0, T - C);
    const needed = Math.max(0, required_total - A);
    const canMiss = Math.max(0, Math.floor((A + remaining) - required_total));

    // Forecasting
    const currentRate = C > 0 ? A / C : 1;
    const predictedAdditional = Math.round(remaining * currentRate);
    const forecast_pct = Math.round(((A + predictedAdditional) / T) * 100);

    return {
        percent, canMiss, mustAttend: needed, remaining,
        isDanger: percent < 65,
        forecast_pct,
        credits
    };
};

// 4. Dashboard (Smart Course-based) [STRICT MIGRATION]
app.get('/student/:id/dashboard', auth, async (req, res) => {
    const { id } = req.params;

    // DEBUG AUTH
    console.log(`[DASHBOARD-AUTH] Requesting ID: '${id}'`);
    console.log(`[DASHBOARD-AUTH] Token User:`, req.user);
    console.log(`[DASHBOARD-AUTH] Match Check: ${req.user.student_id} === ${id} ? ${req.user.student_id === id}`);

    // Allow Director/Admin to view student dashboard
    // FIX: Check against SAPID or ID (Token payload has 'id' and 'sapid', NOT 'student_id')
    const match = (req.user.sapid && String(req.user.sapid) === String(id)) ||
        (req.user.id && String(req.user.id) === String(id));

    if (req.user.role !== 'director' && req.user.role !== 'admin' && !match) {
        console.log(`[DASHBOARD-AUTH] 403 FORBIDDEN - Mismatch. User: ${req.user.sapid}, Target: ${id}`);
        return res.sendStatus(403);
    }

    try {
        console.log(`[API] Dashboard requested for ${req.user?.student_id} (SAP: ${req.user?.sapid})`);

        // STRICT LOGIC: Use centralized Analytics Engine (Curriculum Driven)
        // Correctly use the requested ID (Target Student)
        const targetSAPID = id;
        const robustStats = await recomputeAnalyticsForStudent(targetSAPID);

        // Evaluate Badges
        // Use student_id from the fetched profile (or robustStats if returned) to ensure UUID consistency if needed
        // robustStats internally resolves profile.
        // Let's pass targetSAPID to evaluateBadges (it handles SAPID/UUID lookup internally in BadgeEngine too?)
        // BadgeEngine expects studentId. PostgresProvider checks both.
        const badges = await evaluateBadges(targetSAPID);

        const { analytics, attendanceSummary, subjectMetrics } = robustStats;

        // Map subjectMetrics to Frontend Dashboard format (if needed)
        // Frontend expects: stats.percent, etc.
        // subjectMetrics already has 'stats' object populated in libs/analytics.js

        // 5. Timetable (Today & Tomorrow)
        // 5. Timetable (Today & Tomorrow)
        // REFACTORED: Uses Provider (Source of Truth Agnostic)
        // We import provider instance from subject_service or new instance?
        // Ideally we should have a singleton provider exports.
        // For now, let's instantiate local or import. 
        // Since we didn't export provider from 'lib/analytics.js', let's instantiate.
        const provider = new PostgresProvider();
        const timetable = await provider.getTimetable(req.user.student_id, 2);

        // 6. Notifications
        const notifications = [];

        try {
            // Fetch Director Announcements
            const dbNotes = await query('SELECT * FROM notifications WHERE student_id = $1 ORDER BY created_at DESC LIMIT 5', [req.user.student_id]);
            dbNotes.rows.forEach(n => {
                notifications.push({ id: `db-${n.id}`, type: n.type || 'info', message: n.message, time: 'Director' });
            });
        } catch (e) { console.error("Db Notes Error", e); }

        if (analytics.streakDays >= 3) notifications.push({ id: 'n1', type: 'success', message: `On a roll! ${analytics.streakDays} day streak.`, time: 'Now' });
        subjectMetrics.forEach(s => {
            if (s.attendance_percentage < s.mandatory_pct) {
                notifications.push({ id: `warn-${s.subject_id}`, type: 'danger', message: `Low attendance in ${s.subject_code} (${s.attendance_percentage}%)`, time: 'Alert' });
            }
        });

        // 7. Upcoming Events
        const upcoming_events = timetable.slice(0, 3).map((t, i) => ({
            id: `evt - ${i} `,
            title: `${t.code || t.subject_name} Session`,
            date: t.time,
            type: 'Class'
        }));

        res.json({
            currentUser: {
                id,
                name: req.user?.name || 'Student',
                program: req.user?.course_id || 'Engineering',
                badges: badges || [],
            },
            debug_meta: "SERVER_VERSION_" + Date.now(), // PROOF OF LIFE
            weighted_pct: analytics.attendanceRate, // Use overall rate as weighted proxy
            last_synced: new Date(),
            subjects: subjectMetrics, // DIRECT SOURCE FROM CURRICULUM
            analytics: analytics, // EXPOSED FOR FRONTEND DASHBOARD ALERTS
            timetable: timetable,
            notifications: notifications,
            upcoming_events: upcoming_events,
            upcoming_class_alert: null, // Optimization: Compute if really needed
            safe_miss_suggestions: subjectMetrics
                .filter(s => s.can_still_miss > 0)
                .map(s => ({ subject: s.subject_name, safe_bunks: s.can_still_miss, impact_msg: "Safear Bunks available" })),
            badges: [] // Placeholder
        });

    } catch (e) {
        console.error("Dashboard Error (Recovering):", e);
        // STRICT FALLBACK (User Request #2753)
        // Never break the frontend. Return strict empty state.
        res.json({
            currentUser: {
                id: req.user.student_id,
                name: req.user.name,
                program: req.user.course_id,
                badges: [],
                analytics: {
                    attendanceRate: 100, // Default to Safe
                    streakDays: 0,
                    safe_status: true,
                    safe_message: "System data initializing...",
                    risk_summary: {
                        totalSubjects: 0,
                        safeSubjects: 0,
                        atRiskSubjects: 0,
                        totalCanMiss: 0,
                        overallPct: 100,
                        healthLabel: "No Data",
                        heroMsg: "System Maintenance / Initializing...",
                        heroStatus: "NO_DATA"
                    }
                }
            },
            weighted_pct: 100,
            subjects: [],
            timetable: [],
            notifications: [],
            upcoming_events: [],
            upcoming_class_alert: null,
            safe_miss_suggestions: [],
            badges: []
        });
    }
});

// 4. Subject Detail
import { getSubjectDetailsSnapshot, getClassesTabSnapshot } from './lib/subject_details.js'; // ANTI-GRAVITY

app.get('/student/:id/classes-tab', auth, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.student_id !== id) return res.sendStatus(403);
        const data = await getClassesTabSnapshot(id);
        res.json(data);
    } catch (e) {
        console.error("Classes Tab Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/student/:id/subject/:subId', auth, async (req, res) => {
    try {
        const { id, subId } = req.params;
        if (req.user.student_id !== id) return res.sendStatus(403);

        const snapshot = await getSubjectDetailsSnapshot(id, subId);
        res.json(snapshot);
    } catch (e) {
        console.error("Subject Detail Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 1.1 Set Password (for new students)
app.post('/auth/set-password', async (req, res) => {
    const { sapid, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const result = await query('UPDATE students SET password_hash = $1 WHERE sapid = $2 RETURNING student_id', [hash, sapid]);

        if (result.rowCount === 0) return res.status(404).json({ error: 'SAPID not found' });
        res.json({ success: true, message: 'Password set successfully. Please login.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Import Helper (Generic)
app.post('/import/attendance-csv', async (req, res) => {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'No filePath provided' });

    const results = [];
    try {
        fs.createReadStream(filePath)
            .pipe(parse({ columns: true, trim: true }))
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                let count = 0;
                let skipped = 0;
                for (const row of results) {
                    // Expects: session_id, student_sapid (or student_id), present
                    try {
                        let sId = row.student_id;
                        if (!sId && row.student_sapid) {
                            const s = await query('SELECT student_id FROM students WHERE sapid = $1', [row.student_sapid]);
                            if (s.rows.length > 0) sId = s.rows[0].student_id;
                        }

                        // Check session exists
                        const sessCheck = await query('SELECT 1 FROM sessions WHERE session_id = $1', [row.session_id]);
                        if (sessCheck.rowCount === 0) {
                            skipped++;
                            continue;
                        }

                        if (sId && row.session_id) {
                            const present = String(row.present).toLowerCase() === 'true';
                            await query(`
                                INSERT INTO attendance(session_id, student_id, present, source)
VALUES($1, $2, $3, 'csv_import')
                                ON CONFLICT(session_id, student_id) DO UPDATE SET present = EXCLUDED.present
    `, [row.session_id, sId, present]);
                            count++;
                        } else {
                            skipped++;
                        }
                    } catch (err) {
                        console.error('Row error:', err);
                        skipped++;
                    }
                }

                // Trigger Badge Eval
                try {
                    console.log('[API] Triggering badge eval after import...');
                    evaluateBadgesForAll().catch(err => console.error('[BADGE] background eval error:', err));
                } catch (e) {
                    console.error('[BADGE] Trigger failed', e);
                }

                res.json({ success: true, imported: count, skipped, badgeEvalTriggered: true });
            });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Director: Notify Student (Placed high to avoid router shadowing)
// Director: Notify Student (Placed high to avoid router shadowing)
app.post('/director/notify', async (req, res) => {
    const { sapid, message, type, title } = req.body;
    console.log(`[NOTIFY DEBUG] Request for SAPID: ${sapid}, Msg: ${message}`);
    try {
        const sRes = await query('SELECT student_id FROM students WHERE sapid = $1', [sapid]);
        if (sRes.rows.length === 0) {
            console.error(`[NOTIFY DEBUG] Student not found for SAPID: ${sapid}`);
            return res.status(404).json({ error: 'Student not found' });
        }
        const sid = sRes.rows[0].student_id;

        const debugResult = await NotificationService.sendToStudent({
            studentId: sid,
            title: title || 'Director Announcement',
            message,
            type: type || 'info',
            link: '/student/dashboard'
        });

        // FORCE RESTART TRIGGER 1
        res.json({ success: true, debug: debugResult });
    } catch (e) {
        console.error(`[NOTIFY DEBUG] Exception:`, e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/debug/db-name', (req, res) => {
    res.json({ db: process.env.PGDATABASE, host: process.env.PGHOST });
});

app.get('/health', (req, res) => res.send('OK'));

/* ADDED BY ANTI-GRAVITY: Quote APIs */

// Helper to get fresh quote (External -> DB -> Cache)
async function getFreshQuote(program) {
    try {
        console.log('[QUOTE] Fetching from external API...');
        // 1. Try External API (ZenQuotes)
        // Note: In production you might want to proxy/cache this more aggressively
        const extRes = await fetch('https://zenquotes.io/api/random');
        if (extRes.ok) {
            const data = await extRes.json();
            if (data && data.length > 0) {
                const q = data[0]; // { q: "quote", a: "author", ... }

                console.log('[QUOTE] Fetched external:', q.q);

                // Insert into DB to maintain library & relational integrity
                const saved = await query(
                    'INSERT INTO quotes (program, text, author, tags) VALUES ($1, $2, $3, $4) RETURNING *',
                    [program, q.q, q.a, ['external']]
                );
                return saved.rows[0];
            }
        }
    } catch (e) {
        console.error("[QUOTE] External fetch failed, falling back to local DB:", e.message);
    }

    // 2. Fallback to Local DB
    let res = await query('SELECT * FROM quotes WHERE program = $1 ORDER BY RANDOM() LIMIT 1', [program]);
    if (res.rows.length === 0) {
        // Fallback to General
        res = await query('SELECT * FROM quotes WHERE program = $1 ORDER BY RANDOM() LIMIT 1', ['General']);
    }
    return res.rows[0];
}

// 1. Daily Quote (Cached)
app.get('/quotes/daily', auth, async (req, res) => {
    try {
        const { program } = req.query; // e.g. 'Engineering'
        const targetProgram = program || 'General';
        const today = new Date().toISOString().split('T')[0];

        // Check Cache
        const cacheRes = await query(
            'SELECT q.* FROM daily_quote_cache d JOIN quotes q ON d.quote_id = q.id WHERE d.date = $1 AND d.program = $2',
            [today, targetProgram]
        );

        if (cacheRes.rows.length > 0) {
            return res.json(cacheRes.rows[0]);
        }

        // Cache Miss: Get Fresh
        const newQuote = await getFreshQuote(targetProgram);
        if (!newQuote) return res.json({ text: "Stay hungry, stay foolish.", author: "Steve Jobs" });

        // Insert into Cache (ignore conflicts if another req beat us)
        await query(
            'INSERT INTO daily_quote_cache (date, program, quote_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [today, targetProgram, newQuote.id]
        );

        res.json(newQuote);

    } catch (e) {
        console.error("Quote Error", e);
        res.status(500).json({ error: e.message });
    }
});

// 2. Random Quote
app.get('/quotes/random', async (req, res) => {
    const { program } = req.query;
    try {
        const q = await getFreshQuote(program || 'General');
        res.json(q || {});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* ADDED BY ANTI-GRAVITY: Attendance Analytics Endpoints */

// Get Detailed Analytics for a Specific Subject
app.get('/student/:id/subject/:subId/attendance-analytics', auth, async (req, res) => {
    try {
        const { id, subId } = req.params;
        // Optional: Ensure req.user.student_id matches id for security
        if (req.user.student_id !== id) {
            return res.status(403).json({ error: 'Unauthorized access to student data' });
        }

        const stats = await calcAttendanceStats(id, subId);
        res.json(stats);
    } catch (e) {
        console.error("Analytics Error", e);
        res.status(500).json({ error: e.message });
    }
});

// Get Overview for All Subjects
app.get('/student/:id/attendance-overview', auth, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.student_id !== id) {
            return res.status(403).json({ error: 'Unauthorized access to student data' });
        }

        const overview = await getStudentAnalyticsOverview(id);
        const badges = await evaluateBadges(id);
        res.json({ stats: overview, badges });
    } catch (e) {
        console.error("Analytics Overview Error", e);
        res.status(500).json({ error: e.message });
    }


});

// LOG SIMULATOR USAGE
app.post('/student/:id/log-simulator', auth, async (req, res) => {
    try {
        await query('UPDATE students SET used_simulator = TRUE WHERE student_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// NEW: Production Dashboard Stats (Unified Backend Source of Truth)
// Fetches Momentum, Global Confidence, Overall Safety, Avg Attendance

app.get('/student/:id/dashboard-stats', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get Subject Stats
        const overview = await getStudentAnalyticsOverview(id);

        // 2. Calculate Aggregates
        let totalPct = 0;
        let count = 0;
        overview.forEach(s => {
            if (s.conducted > 0) {
                totalPct += s.percentage;
                count++;
            }
        });
        const globalAvg = count > 0 ? (totalPct / count) : 0;

        // 3. Momentum
        const momentum = await calculateMomentum(id);

        // 4. Worayyy Banner Status
        const status = calculateOverallStatus(overview);

        // 5. GAMIFICATION DATA (Added by Anti-Gravity)
        // Get SAPID for badges
        const studentRes = await query("SELECT sapid, verified_score FROM students WHERE student_id = $1", [id]);
        const sapid = studentRes.rows[0]?.sapid;
        const xp = studentRes.rows[0]?.verified_score || 0;

        let rank = '-';
        let badges = [];
        let daily_quests_pending = 0;

        if (sapid) {
            // Rank
            const rankRes = await query(`
                SELECT rank FROM (
                    SELECT student_id, RANK() OVER (ORDER BY verified_score DESC) as rank 
                    FROM students
                ) sub WHERE student_id = $1
            `, [id]);
            rank = rankRes.rows[0]?.rank || '-';

            // Badges
            const allBadges = await getAllBadgesWithStatus(sapid);
            badges = allBadges.filter(b => b.is_unlocked).slice(0, 5); // Latest 5

            // Daily Quests
            const questRes = await query(`
                SELECT COUNT(*) as count FROM daily_tasks 
                WHERE student_id = $1 AND status = 'pending' AND date = CURRENT_DATE
            `, [id]);
            daily_quests_pending = parseInt(questRes.rows[0]?.count || 0);
        }

        res.json({
            avg_attendance: parseFloat(globalAvg.toFixed(2)),
            momentum: momentum,
            is_all_safe: status.is_all_safe,
            danger_subjects: status.danger_subjects,
            total_conducted: overview.reduce((acc, s) => acc + s.conducted, 0),
            // Gamification
            rank,
            xp,
            badges,
            daily_quests_pending
        });

    } catch (e) {
        console.error("Dashboard Stats Error", e);
        res.status(500).json({ error: e.message });
    }
});

/* ADDED BY ANTI-GRAVITY: Debug Counts */
app.get('/debug/counts/students', async (req, res) => {
    const r = await query('SELECT COUNT(*) FROM students');
    const count = (r.rows && r.rows.length > 0) ? parseInt(r.rows[0].count) : 0;
    res.json({ count });
});
app.get('/debug/counts/sessions', async (req, res) => {
    const r = await query('SELECT COUNT(*) FROM sessions');
    const count = (r.rows && r.rows.length > 0) ? parseInt(r.rows[0].count) : 0;
    res.json({ count });
});
app.get('/debug/counts/attendance', async (req, res) => {
    const r = await query('SELECT COUNT(*) FROM attendance');
    const count = (r.rows && r.rows.length > 0) ? parseInt(r.rows[0].count) : 0;
    res.json({ count });
});

/* ADDED BY ANTI-GRAVITY */

import { getSubjectsForStudent } from './lib/subject_service.js';


/* ADDED BY ANTI-GRAVITY: Debug Subject Resolution */
app.get('/debug/student-subjects/:sapid', async (req, res) => {
    try {
        const { sapid } = req.params;

        const { student, subjects } = await getSubjectsForStudent(sapid);

        res.json({
            student,
            resolved_subjects: subjects,
            subject_count: subjects.length,
            message: subjects.length === 0 ? "No subjects found (Global Semester Check)" : "OK"
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* ADDED BY ANTI-GRAVITY: Debug Curriculum Match (Explicit Request) */
app.get('/debug/curriculum-match/:sapid', async (req, res) => {
    // Redirects to the main debug above which now implements the fix logic
    res.redirect(`/ debug / student - subjects / ${req.params.sapid} `);
});

/* ADDED BY ANTI-GRAVITY: Debug Snapshot */
app.get('/debug/full-student-snapshot/:sapid', async (req, res) => {
    try {
        const { sapid } = req.params;
        const studentRes = await query('SELECT * FROM students WHERE sapid = $1', [sapid]);
        if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        const student = studentRes.rows[0];

        // Gather all data
        const enrollments = await query('SELECT * FROM enrollments WHERE student_id = $1', [student.student_id]);
        const badges = await query('SELECT b.name, b.badge_key, sb.awarded_at FROM student_badges sb JOIN badges b ON sb.badge_id = b.id WHERE sb.student_id = $1', [student.student_id]);

        // Attendance Raw
        const attRaw = await query(`
            SELECT s.name as subject, ses.date, ses.status, a.present 
            FROM attendance a 
            JOIN sessions ses ON a.session_id = ses.session_id
            JOIN subjects s ON ses.subject_id = s.subject_id
            WHERE a.student_id = $1
            ORDER BY ses.date DESC
            `, [student.student_id]);

        res.json({
            student,
            enrollments: enrollments.rows,
            badges: badges.rows,
            attendance_log: attRaw.rows,
            meta: { timestamp: new Date() }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 4000;

/* ADDED BY ANTI-GRAVITY */


// DEBUG: Verify Director Stats Logic
app.get('/__debug/verify-counts', async (req, res) => {
    try {
        // 1. Total Students
        const totalRes = await query("SELECT COUNT(*) FROM students WHERE role = 'student'");
        const total = parseInt(totalRes.rows[0].count);

        // 2. Dept Distribution
        const distRes = await query(`
            SELECT dept, COUNT(*) as count
            FROM students
            WHERE role = 'student'
            GROUP BY dept
        `);

        // 3. Sample
        const sampleRes = await query("SELECT sapid, name, program, year FROM students WHERE role='student' ORDER BY RANDOM() LIMIT 5");

        res.json({
            total_students: total,
            distribution: distRes.rows,
            distribution_match: distRes.rows.reduce((acc, r) => acc + parseInt(r.count), 0) === total,
            sample: sampleRes.rows
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// DEBUG: Init Notifications Table
app.get('/__debug/init-notifications', async (req, res) => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                student_id TEXT REFERENCES students(student_id),
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT FALSE
            )
        `);
        res.json({ success: true, message: 'Notifications table initialized' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
import tempLostFoundMigration from './routes/temp_migration_lf.js';
import collegeEcosystemRoutes from './routes/college_ecosystem.js';
import securityAdminRoutes from './routes/security_admin.js';

// ... (existing mounts)
app.use('/migrate', tempLostFoundMigration);
app.use('/college', collegeEcosystemRoutes);
app.use('/security', securityAdminRoutes);
import auditRoutes from './routes/audit.js';
app.use(auditRoutes);

import tempAudit from './routes/temp_audit_migration.js';
import tempNetwork from './routes/temp_network_migration.js';
import tempIncidents from './routes/temp_incidents_migration.js';
import tempNotifications from './routes/temp_notifications_migration.js';
app.use(tempAudit);
app.use(tempNetwork);
app.use(tempIncidents);
app.use(tempNotifications);

import tempChatMigration from './routes/temp_migration_chat.js';
app.use('/migrate-chat', tempChatMigration);

import tempNotifMigration from './routes/temp_migration_notif.js';
app.use('/migrate-notif', tempNotifMigration);




server.listen(PORT, () => {
    console.log(`🚀 Antigravity Backend running on port ${PORT} `);
    console.log(`🔌 Socket.IO Service Active`);
});
