/**
 * PostgresProvider.js
 * Production implementation using the local PostgreSQL database.
 * Refactored from direct SQL calls in analytics.js and badge_engine.js.
 */
import { IDataProvider } from './IDataProvider.js';
import { query } from '../db.js';
import { normalizeProgram } from '../lib/program_mapper.js';
import { normalizeBranch } from '../lib/program_branch_mapper.js';

export class PostgresProvider extends IDataProvider {

    // --- STUDENT CONTEXT ---
    async getStudentProfile(sapid) {
        console.log(`[PostgresProvider] getStudentProfile called with: '${sapid}'`);
        const res = await query(
            'SELECT student_id, sapid, program, dept, semester, name, year, has_been_danger, used_simulator FROM students WHERE sapid = $1 OR student_id = $1',
            [sapid]
        );
        if (res.rows.length === 0) {
            console.log(`[PostgresProvider] Student '${sapid}' NOT FOUND in DB.`);
            return null;
        }
        console.log(`[PostgresProvider] Found student: ${res.rows[0].sapid} (ID: ${res.rows[0].student_id})`);
        return res.rows[0];
    }

    async getSubjectEnrollments(studentId) {
        console.log(`[PostgresProvider] getSubjectEnrollments called with: '${studentId}'`);
        // Fetch Student First to get Context
        const student = await this.getStudentProfile(studentId);
        if (!student) throw new Error("Student not found for enrollments");

        // DEBUG: Check Raw Counts
        const rawE = await query("SELECT count(*) FROM enrollments WHERE student_id = $1", [student.student_id]);
        console.log(`[PostgresProvider] Raw Enrollments for ${student.student_id}: ${rawE.rows[0].count}`);

        const rawS = await query("SELECT count(*) FROM subjects WHERE subject_id = 'SUB01'");
        console.log(`[PostgresProvider] Raw Subject SUB01 exists: ${rawS.rows[0].count}`);

        // Normalize Program/Branch Logic (moved from subject_service.js)
        let effectiveProgram = normalizeProgram(student.program);
        const normBranch = normalizeBranch(student.dept);

        if (effectiveProgram.toLowerCase() === 'engineering') {
            if (normBranch && normBranch.toLowerCase() !== 'engineering') {
                effectiveProgram = `${effectiveProgram.toLowerCase()}-${normBranch.toLowerCase()}`;
            } else {
                effectiveProgram = effectiveProgram.toLowerCase();
            }
        } else {
            effectiveProgram = effectiveProgram.toLowerCase();
        }

        let fallbackProgram = normalizeProgram(student.program).toLowerCase();

        const enrollRes = await query(`
            SELECT 
                s.code as subject_code, 
                s.name as subject_name, 
                s.subject_id,
                40 as total_classes, -- Default if missing from subjects table (subjects has it, but aliasing might vary)
                75 as min_attendance_pct, -- Default safety
                4 as credits
            FROM enrollments e
            JOIN subjects s ON e.subject_id = s.subject_id
            WHERE e.student_id = $1
            ORDER BY s.code ASC
        `, [student.student_id]);

        return enrollRes.rows;
    }

    // --- TIMETABLE & SESSIONS ---
    // --- TIMETABLE & SESSIONS ---
    async updateSessionStatus() {
        // STRICT AUDIT REMOVAL: 
        // We do NOT auto-update session status based on time. 
        // Status must be explicitly set by the ingestion/verification process.
        // This method is now a no-op to prevent 'guessing'.
        // console.log("[Strict Audit] Skipping auto-update of session status.");
    }

    async getTimetable(studentId, days = 2) {
        try {
            const res = await query(`
                SELECT
                    s.name as subject_name,
                    s.code,
                    ses.date,
                    ses.start_time as time,
                    ses.room,
                    CASE 
                        WHEN (ses.date + ses.start_time) <= CURRENT_TIMESTAMP THEN 'CONDUCTED'
                        ELSE 'UPCOMING'
                    END as status,
                    ses.session_id,
                    ses.subject_id
                FROM sessions ses
                JOIN subjects s ON ses.subject_id = s.subject_id
                JOIN enrollments e ON s.subject_id = e.subject_id
                WHERE e.student_id = $1
                  AND ses.date >= CURRENT_DATE 
                  AND ses.date < CURRENT_DATE + ($2::int * INTERVAL '1 day')
                ORDER BY ses.date, ses.start_time
            `, [studentId, days]);

            return res.rows.map(t => ({
                id: t.session_id,
                subject_id: t.subject_id,
                date: t.date, // Required for Frontend Filter
                time: t.time,
                room: t.room || 'TBA',
                code: t.code,
                status: t.status
            }));
        } catch (e) {
            console.error("Timetable Query Failed", e.message);
            return [];
        }
    }

    // --- ANALYTICS METRICS ---
    async getAttendanceMetrics(subjectIds, studentId) {
        // A. Conducted: All sessions in past for the student's subjects
        // B. Attended: Conducted sessions where (Attendance = Present OR Attendance IS NULL)
        const metricsRes = await query(`
            WITH relevant_sessions AS (
                SELECT session_id, subject_id, conducted_count
                FROM sessions
                WHERE subject_id = ANY($1)
                AND status = 'conducted' -- STRICT: Only explicitly conducted sessions
            ),
            attended_count AS (
                SELECT rs.subject_id, SUM(rs.conducted_count) as a_count
                FROM relevant_sessions rs
                LEFT JOIN attendance a ON rs.session_id = a.session_id AND a.student_id = $2
                WHERE a.present = true -- STRICT: Only explicitly marked present
                GROUP BY rs.subject_id
            ),
            conducted_count AS (
                SELECT subject_id, SUM(conducted_count) as c_count
                FROM relevant_sessions
                GROUP BY subject_id
            ),
            all_planned_count AS (
                SELECT subject_id, SUM(conducted_count) as p_count
                FROM sessions
                WHERE subject_id = ANY($1)
                GROUP BY subject_id
            )
            SELECT 
                sub.subject_id, 
                COALESCE(cc.c_count, 0) as conducted,
                COALESCE(ac.a_count, 0) as attended,
                COALESCE(ap.p_count, 0) as total_planned
            FROM unnest($1::text[]) as sub(subject_id)
            LEFT JOIN conducted_count cc ON cc.subject_id = sub.subject_id
            LEFT JOIN attended_count ac ON ac.subject_id = sub.subject_id
            LEFT JOIN all_planned_count ap ON ap.subject_id = sub.subject_id
        `, [subjectIds, studentId]);

        return metricsRes.rows;
    }

    async getRecentTrend(subjectIds, studentId) {
        try {
            const trendRes = await query(`
                WITH recent_sessions AS (
                    SELECT 
                        subject_id, 
                        conducted_count,
                        session_id,
                        ROW_NUMBER() OVER (PARTITION BY subject_id ORDER BY date DESC, start_time DESC) as rn
                    FROM sessions
                    WHERE subject_id = ANY($1)
                    AND status = 'conducted'
                )
                SELECT 
                    rs.subject_id,
                    SUM(rs.conducted_count) as recent_conducted,
                    COALESCE(SUM(CASE WHEN a.present = true THEN rs.conducted_count ELSE 0 END), 0) as recent_attended
                FROM recent_sessions rs
                LEFT JOIN attendance a ON rs.session_id = a.session_id AND a.student_id = $2
                WHERE rs.rn <= 5
                GROUP BY rs.subject_id
            `, [subjectIds, studentId]);

            return trendRes.rows;
        } catch (e) {
            console.error("Trend Query Failed", e.message);
            return [];
        }
    }

    async getWeeklyHeatmap(studentId) {
        try {
            const res = await query(`
                SELECT 
                    to_char(date, 'Dy') as day_name,
                    COUNT(*) as total_classes,
                    COALESCE(SUM(CASE WHEN a.present = true THEN 1 ELSE 0 END), 0) as attended
                FROM sessions s
                LEFT JOIN attendance a ON s.session_id = a.session_id AND a.student_id = $1
                WHERE s.date >= CURRENT_DATE - INTERVAL '6 days'
                AND s.date <= CURRENT_DATE
                GROUP BY date
                ORDER BY date ASC
            `, [studentId]);
            return res.rows;
        } catch (e) {
            console.error("Heatmap Query Failed", e.message);
            return [];
        }
    }

    // --- BADGES ---
    async getDetailedSessionHistory(studentId) {
        const historyRes = await query(`
            SELECT s.date, s.session_id, a.present 
            FROM sessions s
            JOIN enrollments e ON s.subject_id = e.subject_id
            LEFT JOIN attendance a ON s.session_id = a.session_id AND a.student_id = $1
            WHERE e.student_id = $1
              AND s.status = 'conducted' -- STRICT: Only conducted sessions count for history/badges
            ORDER BY s.date ASC, s.start_time ASC
        `, [studentId]);
        return historyRes.rows;
    }

    async awardBadge(studentId, badgeCode) {
        await query(`
            INSERT INTO student_badges (student_id, badge_code, awarded_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (student_id, badge_code) DO NOTHING
        `, [studentId, badgeCode]);
    }

    async getEarnedBadges(studentId) {
        const res = await query('SELECT * FROM student_badges WHERE student_id = $1', [studentId]);
        return res.rows;
    }

    async getAllBadges() {
        const res = await query('SELECT * FROM badges');
        return res.rows;
    }

    async markStudentDangerHistory(studentId) {
        await query('UPDATE students SET has_been_danger = TRUE WHERE student_id = $1', [studentId]);
    }
}
