/* ADDED BY ANTI-GRAVITY */
/**
 * badges.js
 * Evaluates badge rules and awards them.
 * ALIGNED WITH LIVE SCHEMA:
 * badges (code, name, description, icon, unlock_criteria, category)
 * student_badges (student_id, badge_code, awarded_at, metadata)
 */

import { getClient, query } from '../db.js';
import { recomputeAnalyticsForStudent } from './analytics.js';

export async function evaluateBadgesForStudent(sapid) {
    const client = await getClient();
    try {
        // 1. Get Student Data & Analytics
        const { analytics } = await recomputeAnalyticsForStudent(sapid);
        const { rows: [student] } = await client.query('SELECT student_id, program FROM students WHERE sapid = $1', [sapid]);
        if (!student) return [];

        // 2. Get All Badges
        const badgesQ = await client.query('SELECT * FROM badges');
        const badges = badgesQ.rows;

        const newlyAwarded = [];

        // 3. Evaluate Rules
        for (const badge of badges) {
            let qualifies = false;
            // LIVE SCHEMA FIX: Use 'unlock_criteria'
            const rule = badge.unlock_criteria || {};

            if (rule.type === 'streak') {
                if (analytics.streakDays >= (rule.days || rule.threshold || 0)) qualifies = true;
            } else if (rule.type === 'attendance') {
                if (analytics.attendanceRate >= (rule.pct || rule.threshold || 0)) qualifies = true;
            } else if (rule.type === 'perfect_week') {
                if (analytics.attendanceRate >= 100) qualifies = true;
            } else if (rule.type === 'first_steps') {
                if (analytics.classes_conducted >= 3) qualifies = true;
            }

            if (qualifies) {
                // LIVE SCHEMA FIX: Use 'badge_code'
                const res = await client.query(`
                    INSERT INTO student_badges (student_id, badge_code)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    RETURNING *;
                `, [student.student_id, badge.code]);

                // Note: If no ON CONFLICT unique index exists, this might insert duplicates.
                // Assuming application-level check or effective idempotency is acceptable for now given strict schema unknowns.
                if (res.rowCount > 0) newlyAwarded.push(badge.name);
            }
        }
        return newlyAwarded;
    } catch (err) {
        // Suppress duplicate key errors if index exists
        if (err.code === '23505') return [];
        console.error('evaluateBadgesForStudent error', err);
        return [];
    } finally {
        client.release();
    }
}

export async function evaluateBadgesForAll() {
    const { rows } = await query('SELECT sapid FROM students');
    const results = {};
    for (const s of rows) {
        const awarded = await evaluateBadgesForStudent(s.sapid);
        if (awarded.length > 0) results[s.sapid] = awarded;
    }
    return results;
}

/**
 * Returns FULL badge list for UI (Locked & Unlocked).
 * Schema: { id, name, description, is_unlocked, unlock_condition_text, icon }
 */
export async function getAllBadgesWithStatus(sapid) {
    const client = await getClient();
    try {
        // 1. Get Student ID
        const { rows: [student] } = await client.query('SELECT student_id FROM students WHERE sapid = $1', [sapid]);
        if (!student) return [];

        // 2. Get All Badges
        // LIVE SCHEMA FIX: Order by 'code'
        const badgesQ = await client.query('SELECT * FROM badges ORDER BY code ASC');

        // 3. Get Awarded Badges
        // LIVE SCHEMA FIX: Select 'badge_code'
        const awardedQ = await client.query('SELECT badge_code FROM student_badges WHERE student_id = $1', [student.student_id]);
        const awardedCodes = new Set(awardedQ.rows.map(r => r.badge_code));

        // 4. Map & Format
        const mapped = badgesQ.rows.map(b => ({
            badge_id: b.code, // Use code as ID for UI
            name: b.name,
            description: b.description,
            is_unlocked: awardedCodes.has(b.code),
            unlock_condition_text: b.description || 'Keep attending classes to unlock.',
            icon: b.icon || 'medal'
        }));

        // Sort: Unlocked first, then by Code
        return mapped.sort((a, b) => {
            if (a.is_unlocked === b.is_unlocked) return a.badge_id.localeCompare(b.badge_id);
            return a.is_unlocked ? -1 : 1;
        });

    } catch (err) {
        console.error('getAllBadgesWithStatus error', err);
        return [];
    } finally {
        client.release();
    }
}
