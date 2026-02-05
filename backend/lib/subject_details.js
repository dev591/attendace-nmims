
import { query } from '../db.js';

/**
 * Subject Details Snapshot Service
 * Single source of truth for the enhanced Subject Details page.
 */
export async function getSubjectDetailsSnapshot(studentId, subjectId) {
    // 1. Fetch Subject Metadata & Policy
    // We join with enrollments to ensure the student is actually enrolled + get specific policy if any
    const subjectRes = await query(`
        SELECT 
            s.subject_id, s.code, s.name, s.credits,
            c.total_classes as planned_total, -- From Curriculum
            c.min_attendance_pct
        FROM subjects s
        JOIN enrollments e ON s.subject_id = e.subject_id
        JOIN curriculum c ON s.code = c.subject_code 
             -- We need to match curriculum loosely or just trust the subject_id link
             -- Ideally we join curriculum on code and partial program match, but let's trust subject_id -> code
        WHERE s.subject_id = $1 
        AND e.student_id = $2
        LIMIT 1
    `, [subjectId, studentId]);

    if (subjectRes.rows.length === 0) {
        throw new Error("Subject not found or student not enrolled.");
    }
    const subject = subjectRes.rows[0];

    // 2. Fetch All Sessions (Ordered)
    // Get everything to calculate stats dynamically
    const sessionsRes = await query(`
        SELECT 
            s.session_id, s.date, s.start_time, s.end_time, s.type, s.room, s.status as sys_status,
            a.present, a.marked_at
        FROM sessions s
        LEFT JOIN attendance a ON s.session_id = a.session_id AND a.student_id = $2
        WHERE s.subject_id = $1
        ORDER BY s.date ASC, s.start_time ASC
    `, [subjectId, studentId]);

    const allSessions = sessionsRes.rows;

    // 3. Process Logic
    const now = new Date();
    const history = [];
    const upcoming = [];

    let conducted = 0;
    let attended = 0;
    let missed = 0;

    for (const sess of allSessions) {
        // Parse dates
        const dateStr = sess.date instanceof Date ? sess.date.toISOString().split('T')[0] : sess.date;
        const startDateTime = new Date(`${dateStr}T${sess.start_time}`);
        const endDateTime = new Date(`${dateStr}T${sess.end_time}`); // Approximate if needed

        const isPast = endDateTime < now;

        if (isPast) {
            // HISTORY
            let status = 'PENDING'; // Default if not marked

            if (sess.present === true) {
                status = 'PRESENT';
                attended++;
            } else if (sess.present === false) {
                status = 'ABSENT';
                missed++;
            } else {
                // Not marked yet. 
                // Policy: Do we count this as conducted? 
                // Usually YES, but attendance is 0/0 or 0/1?
                // For "Classes Held", it counts. For "Attended", it doesn't.
                status = 'PENDING';
            }

            conducted++;

            history.push({
                session_id: sess.session_id,
                date: dateStr,
                time: sess.start_time,
                type: sess.type,
                status: status, // PRESENT, ABSENT, PENDING
                marked_at: sess.marked_at
            });

        } else {
            // UPCOMING
            upcoming.push({
                session_id: sess.session_id,
                date: dateStr,
                time: sess.start_time,
                room: sess.room,
                type: sess.type
            });
        }
    }

    // Sort History DESC (Newest first)
    history.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));

    // 4. Calculate Indicators (Risk, Can Miss)
    const mandatoryPct = subject.min_attendance_pct || 75; // Default 75
    // Use Timetable count if available and greater than 0, else curriculum
    const totalPlanned = Math.max(allSessions.length, subject.planned_total || 45);

    // Att Rate
    // OPTIMISTIC: Default to 100% if no classes held yet
    const currentPct = conducted > 0 ? (attended / conducted) * 100 : 100;

    // "Can Still Miss" Logic
    // Max absences allowed = Total * (1 - target)
    // e.g. 40 classes, 75% target. Max absent = 10.
    const maxAbsent = Math.floor(totalPlanned * (1 - (mandatoryPct / 100)));
    const canStillMiss = Math.max(0, maxAbsent - missed);

    // Risk Zone
    let risk = 'SAFE'; // SAFE, WARNING, DANGER
    // Danger: Even if I attend ALL remaining, I fail.
    const remaining = totalPlanned - conducted;
    const maxPossibleAttended = attended + remaining;
    const maxPossiblePct = (maxPossibleAttended / totalPlanned) * 100;

    if (maxPossiblePct < mandatoryPct) {
        risk = 'DANGER';
    } else if (currentPct < mandatoryPct) {
        risk = 'WARNING';
    }

    return {
        subject: {
            name: subject.name,
            code: subject.code,
            credits: subject.credits,
            policy_pct: mandatoryPct
        },
        stats: {
            total_planned: totalPlanned,
            conducted: conducted,
            attended: attended,
            missed: missed,
            percentage: parseFloat(currentPct.toFixed(1)),
            can_still_miss: canStillMiss,
            risk_status: risk
        },
        upcoming_classes: upcoming, // [ { date, time, room, type }... ]
        session_history: history,   // [ { date, time, status, type }... ] - Newest First
        last_sync: new Date().toISOString()
    };
}

/**
 * Global Classes Tab Snapshot
 * Aggregates all subjects + global upcoming timeline.
 */
export async function getClassesTabSnapshot(studentId) {
    // 1. Get All Enrolled Subjects
    // We need the same strict logic as subject details but for ALL subjects
    const subjectsRes = await query(`
        SELECT DISTINCT ON (s.subject_id)
            s.subject_id, s.code, s.name, s.credits,
            c.total_classes as planned_total,
            c.min_attendance_pct
        FROM subjects s
        JOIN enrollments e ON s.subject_id = e.subject_id
        JOIN curriculum c ON s.code = c.subject_code 
        WHERE e.student_id = $1
        ORDER BY s.subject_id, s.name ASC
    `, [studentId]);

    const subjects = subjectsRes.rows;
    const subjectStats = [];

    // 2. Compute Stats for EACH Subject (Efficiently?)
    // In a huge system, we'd batch this. For < 20 subjects, a loop is fine.
    // We can reuse getSubjectDetailsSnapshot but it might be heavy due to double queries.
    // Let's optimize: Get ALL sessions for student in one go?
    // Actually, distinct queries are safer for correctness right now unless performance hits.

    // Optimization: Single Query for Aggregates
    // ...

    // Let's stick to correctness first.

    for (const sub of subjects) {
        // Reuse the logic (refactoring getSubjectDetailsSnapshot to internal helper would be best, 
        // but for now let's just do a lightweight version here or call the main one)

        try {
            const details = await getSubjectDetailsSnapshot(studentId, sub.subject_id);
            const s = details.stats;

            subjectStats.push({
                subject_id: sub.subject_id,
                name: sub.name,
                code: sub.code,
                attendance_pct: s.percentage,
                conducted: s.conducted,
                missed: s.missed,
                attended: s.attended,
                policy_pct: sub.min_attendance_pct || 75,
                status: s.risk_status, // SAFE, WARNING, DANGER
                margin: {
                    can_miss: s.can_still_miss,
                    must_attend: 0 // Logic for "must attend next X" could go here
                }
            });
        } catch (e) {
            console.warn(`Failed to stat subject ${sub.code}:`, e.message);
        }
    }

    // 3. Global Upcoming Timeline
    // Query ALL sessions for enrolled subjects where date > now
    const upcomingRes = await query(`
        SELECT 
            s.session_id, s.date, s.start_time, s.end_time, s.type, s.room,
            sub.name as subject_name, sub.code as subject_code
        FROM sessions s
        JOIN enrollments e ON s.subject_id = e.subject_id
        JOIN subjects sub ON s.subject_id = sub.subject_id
        WHERE e.student_id = $1
        AND s.date >= CURRENT_DATE - INTERVAL '1 day' 
        ORDER BY s.date ASC, s.start_time ASC
        LIMIT 100
    `, [studentId]);

    // 4. Group by Date & Calculate Status
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const now = new Date(); // Current timestamp for status calc

    const groupedTimetable = [];
    let currentGroup = null;

    for (const row of upcomingRes.rows) {
        const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;

        if (!currentGroup || currentGroup.date !== dateStr) {
            let label = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
            if (dateStr === todayStr) label = "Today";
            if (dateStr === tomorrowStr) label = "Tomorrow";

            currentGroup = {
                date: dateStr,
                label: label,
                sessions: []
            };
            groupedTimetable.push(currentGroup);
        }

        // Calculate Status
        // Note: row.date is just date. We need full datetime for comparison.
        // Assuming row.start_time is 'HH:MM:SS'
        const startDt = new Date(`${dateStr}T${row.start_time}`);
        const endDt = new Date(`${dateStr}T${row.end_time}`);

        let status = 'UPCOMING';
        if (endDt < now) status = 'PAST';
        else if (startDt <= now && endDt >= now) status = 'ONGOING';

        // Calculate Units
        // Theory = 1, Lab = 2 (approx, or derived from conducted_count if available, using strict logic requested)
        // Request: "Lab spanning multiple periods = weighted units"
        // If row.conducted_count is in DB, use it. Else infer.
        // session type 'LAB' usually 2.
        let units = 1;
        if (row.type?.toUpperCase().includes('LAB')) units = 2; // Default rule

        currentGroup.sessions.push({
            session_id: row.session_id,
            subject_name: row.subject_name.replace(/\(.*\)/, '').trim(), // Clean name
            subject_code: row.subject_code,
            type: row.type || 'THEORY',
            start_time: row.start_time.slice(0, 5),
            end_time: row.end_time.slice(0, 5),
            room: row.room || 'TBA',
            status: status,
            attendance_units: units
        });
    }

    return {
        subjects: subjectStats,
        timetable: groupedTimetable, // NEW FULL STRUCTURE
        // upcoming_timeline: upcomingRes.rows.map(...) // Deprecated / Redundant
        meta: {
            total_subjects: subjects.length,
            days_loaded: groupedTimetable.length
        }
    };
}
