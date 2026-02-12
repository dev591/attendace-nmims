
import { normalizeDate } from './import_helpers.js';

/**
 * Core Scheduler Logic: Converts Template -> Concrete Sessions
 */
export async function generateSessionsForRange(client, startDate, endDate, contextFilter = {}) {
    console.log(`[SCHEDULER] Generating sessions from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // 1. Fetch Template Matches
    // If contextFilter has program/sem, we only generate for those (Optimized for Import Trigger)
    let query = `SELECT * FROM timetable_template WHERE 1=1`;
    const params = [];
    if (contextFilter.program) {
        params.push(contextFilter.program);
        query += ` AND program = $${params.length}`;
    }
    if (contextFilter.semester) {
        params.push(contextFilter.semester);
        query += ` AND semester = $${params.length}`;
    }

    const templateRes = await client.query(query, params);
    const templates = templateRes.rows;
    console.log(`[SCHEDULER] Found ${templates.length} template slots.`);

    if (templates.length === 0) return;

    // 2. Iterate Days
    const currDate = new Date(startDate);
    const stopDate = new Date(endDate);
    let sessionCount = 0;

    while (currDate <= stopDate) {
        const dayName = getDayName(currDate); // 'Monday', 'Tuesday'...
        const isoDate = currDate.toISOString().split('T')[0];

        // 3. Filter templates for this Day
        const daySlots = templates.filter(t => t.day_of_week === dayName);

        for (const slot of daySlots) {
            // TODO: Check Holidays Here
            // if (isHoliday(isoDate)) continue;

            const sessionId = generateSessionId(isoDate, slot.start_time, slot.subject_code);

            // Insert/Update Session
            // We use ON CONFLICT DO NOTHING to preserve manual edits/cancellations 
            // (e.g. if Admin cancelled a session, re-running generation shouldn't bring it back? 
            // Actually, DO NOTHING is safe. If it exists, we leave it. If cancelled, it might be deleted or flagged.
            // If deleted, this would re-create it. 
            // Better strategy: If we want to support cancellations, we might need 'status' check.
            // For now, simple generation.

            await client.query(`
                INSERT INTO sessions (
                    session_id, subject_id, date, start_time, end_time, location, status
                ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
                ON CONFLICT (session_id) DO UPDATE SET
                    location = EXCLUDED.location -- Update room if template changed
            `, [sessionId, slot.subject_code, isoDate, slot.start_time, slot.end_time, slot.venue]);

            sessionCount++;
        }

        // Next Day
        currDate.setDate(currDate.getDate() + 1);
    }
    console.log(`[SCHEDULER] Generated/Verified ${sessionCount} sessions.`);
}

function getDayName(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function generateSessionId(dateStr, startTime, subjectCode) {
    // Format: YYYY-MM-DD_HHMMSS_SUB
    const timeClean = startTime.replace(/:/g, '');
    return `${dateStr}_${timeClean}_${subjectCode}`;
}
