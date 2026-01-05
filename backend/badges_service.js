/* ADDED BY ANTI-GRAVITY */
import { query } from './db.js'; // Adapted to use the existing query export from db.js
// Pool is not directly exported in db.js usually based on previous files, but let's check. 
// Actually standard pattern in this codebase seems to be 'import { query } from ./db.js' which wraps pool.query.
// The user provided code uses pool.query. I will adapt it to use `query` function which behaves same (returns result).
import format from 'pg-format';

async function getAllBadgeDefs() {
    const { rows } = await query('SELECT * FROM badges ORDER BY id');
    return rows;
}

async function getStudentBadges(student_id) {
    const { rows } = await query(`
    SELECT b.badge_key, b.name, b.description, b.icon, sb.awarded_at, sb.meta
    FROM badges b
    LEFT JOIN student_badges sb ON b.id = sb.badge_id AND sb.student_id = $1
    ORDER BY b.id
  `, [student_id]);
    return rows.map(r => ({
        badge_key: r.badge_key,
        name: r.name,
        description: r.description,
        icon: r.icon,
        awarded_at: r.awarded_at,
        meta: r.meta,
        unlocked: !!r.awarded_at
    }));
}

// helpers: attendance counts
async function getSubjectStats(student_id, subject_id) {
    // sessions conducted for that subject
    const q1 = await query(
        `SELECT COUNT(*)::int as conducted FROM sessions WHERE subject_id=$1 AND status='conducted'`, [subject_id]
    );
    const conducted = q1.rows[0] ? q1.rows[0].conducted : 0;
    const q2 = await query(
        `SELECT COUNT(*)::int as attended FROM attendance a JOIN sessions s ON a.session_id=s.session_id WHERE s.subject_id=$1 AND a.student_id=$2 AND (a.present IS TRUE OR a.present='1')`, [subject_id, student_id]
    );
    const attended = q2.rows[0] ? q2.rows[0].attended : 0;
    return { subject_id, conducted, attended, percentage: conducted > 0 ? +(attended * 100 / conducted).toFixed(2) : null };
}

async function getOverallStats(student_id) {
    const q = await query(
        `SELECT COUNT(*) FILTER (WHERE s.status='conducted')::int as conducted,
            SUM(CASE WHEN a.present IS TRUE OR a.present='1' THEN 1 ELSE 0 END)::int as attended
     FROM sessions s
     LEFT JOIN attendance a ON a.session_id = s.session_id AND a.student_id = $1`, [student_id]
    );
    if (!q.rows[0]) return { conducted: 0, attended: 0, percentage: null };
    const conducted = q.rows[0].conducted || 0;
    const attended = q.rows[0].attended || 0;
    return { conducted, attended, percentage: conducted > 0 ? +(attended * 100 / conducted).toFixed(2) : null };
}

// consecutive attendance streak (any subject)
async function computeStreak(student_id) {
    // get a list of conducted sessions with whether student present, ordered by date asc
    const q = await query(
        `SELECT s.session_id, s.date, (a.present IS TRUE OR a.present='1') as present
     FROM sessions s
     LEFT JOIN attendance a ON a.session_id = s.session_id AND a.student_id = $1
     WHERE s.status='conducted'
     ORDER BY s.date ASC, s.session_id ASC`, [student_id]
    );
    const rows = q.rows;
    // compute longest tail streak ending at most recent
    let streak = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i].present) streak++;
        else break;
    }
    return streak;
}

// perfect week: check last calendar week or any week?
async function hadPerfectWeek(student_id) {
    // Simple: check most recent completed Monday-Sunday week where there were scheduled classes and ensure student present for all those sessions.
    // For simplicity check last 7 days from today (rolling week)
    const q = await query(
        `SELECT s.session_id, s.date, (a.present IS TRUE OR a.present='1') as present
     FROM sessions s
     LEFT JOIN attendance a ON a.session_id = s.session_id AND a.student_id = $1
     WHERE s.status='conducted' AND s.date >= current_date - interval '6 days'
     ORDER BY s.date ASC`, [student_id]
    );
    const rows = q.rows;
    if (rows.length === 0) return false;
    return rows.every(r => r.present);
}

async function hasEvent(student_id, event_name) {
    // If you have an events table, query it. For now check a simple log table 'events' if exists; else return false.
    try {
        const { rows } = await query(`SELECT 1 FROM events WHERE student_id=$1 AND event_name=$2 LIMIT 1`, [student_id, event_name]);
        return rows.length > 0;
    } catch (e) {
        return false;
    }
}

// cross-subject sequence: check last N conducted sessions are of distinct subjects and attended
async function crossSubjectSequence(student_id, count) {
    const q = await query(
        `SELECT s.session_id, s.subject_id, (a.present IS TRUE OR a.present='1') as present
     FROM sessions s
     LEFT JOIN attendance a ON a.session_id = s.session_id AND a.student_id = $1
     WHERE s.status='conducted'
     ORDER BY s.date DESC, s.session_id DESC
     LIMIT $2`, [student_id, count * 3] // get more rows to find a sequence; we'll scan
    );
    const rows = q.rows;
    // find any sequence of length count where all present and subjects distinct
    for (let start = 0; start <= rows.length - count; start++) {
        const slice = rows.slice(start, start + count);
        if (slice.length < count) break;
        const allPresent = slice.every(r => r.present);
        const subjects = new Set(slice.map(r => r.subject_id));
        if (allPresent && subjects.size === count) return true;
    }
    return false;
}

// award helper
async function awardBadge(student_id, badge_id, meta = {}) {
    // only award if not already awarded
    const check = await query('SELECT id FROM student_badges WHERE student_id=$1 AND badge_id=$2', [student_id, badge_id]);
    if (check.rows.length > 0) return false;
    await query('INSERT INTO student_badges (student_id, badge_id, meta) VALUES ($1,$2,$3)', [student_id, badge_id, meta]);
    console.log('[BADGE] Awarded', badge_id, 'to', student_id);
    return true;
}

// main evaluation for one student
async function evaluateBadgesForStudent(student_id) {
    const defs = await getAllBadgeDefs();
    const unlocked = [];
    for (const d of defs) {
        const criteria = d.criteria;
        let meets = false;
        try {
            switch (criteria.type) {
                case 'streak':
                    {
                        const streak = await computeStreak(student_id);
                        meets = streak >= (criteria.days || 3);
                        if (meets) await awardBadge(student_id, d.id, { streak });
                    }
                    break;
                case 'perfect_week':
                    {
                        const ok = await hadPerfectWeek(student_id);
                        meets = ok;
                        if (meets) await awardBadge(student_id, d.id, {});
                    }
                    break;
                case 'subject_pct':
                    {
                        const stats = await getSubjectStats(student_id, criteria.subject_id);
                        meets = stats.percentage !== null && stats.percentage >= (criteria.pct || 80);
                        if (meets) await awardBadge(student_id, d.id, { subject_id: criteria.subject_id, percentage: stats.percentage });
                    }
                    break;
                case 'overall_pct':
                    {
                        const stats = await getOverallStats(student_id);
                        meets = stats.percentage !== null && stats.percentage >= (criteria.pct || 85);
                        if (meets) await awardBadge(student_id, d.id, { percentage: stats.percentage });
                    }
                    break;
                case 'semester_pct':
                    {
                        // For prototype, treat same as overall_pct (semester logic needs calendar)
                        const stats = await getOverallStats(student_id);
                        meets = stats.percentage !== null && stats.percentage >= (criteria.pct || 95);
                        if (meets) await awardBadge(student_id, d.id, { percentage: stats.percentage });
                    }
                    break;
                case 'event':
                    {
                        const ev = await hasEvent(student_id, criteria.event_name);
                        meets = ev;
                        if (meets) await awardBadge(student_id, d.id, { event: criteria.event_name });
                    }
                    break;
                case 'cross_subject_sequence':
                    {
                        const ok = await crossSubjectSequence(student_id, criteria.count || 5);
                        meets = ok;
                        if (meets) await awardBadge(student_id, d.id, {});
                    }
                    break;
                default:
                    console.log('[BADGE] Unknown criteria type', criteria.type);
            }
        } catch (err) {
            console.error('[BADGE] evaluation error', err);
        }
    }
    // return badges current for student
    return await getStudentBadges(student_id);
}

async function evaluateBadgesForAll(batchSize = 200) {
    console.log('[BADGE] Running evaluation for all students...');
    const q = await query('SELECT student_id FROM students');
    for (const r of q.rows) {
        try {
            await evaluateBadgesForStudent(r.student_id);
        } catch (e) {
            console.error('[BADGE] student eval failed', r.student_id, e);
        }
    }
    console.log('[BADGE] Evaluation complete.');
}

export {
    evaluateBadgesForStudent,
    evaluateBadgesForAll,
    getStudentBadges,
    getAllBadgeDefs,
    awardBadge
};
