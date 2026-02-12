
/**
 * Enriches timetable sessions with real-time status.
 * @param {Array} sessions - Array of session objects with {date, start_time, end_time, status}
 * @returns {Array} - Array with added 'live_status': 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'
 */
export function enrichTimetableWithStatus(sessions) {
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const currentTimeMs = now.getTime();

    return sessions.map(session => {
        // If explicitly cancelled/rescheduled in DB
        if (session.status === 'cancelled') {
            return { ...session, live_status: 'CANCELLED' };
        }

        // Parse Session Date/Time
        // session.date is usually a YYYY-MM-DD string or Date object
        const sessionDateStr = new Date(session.date).toISOString().split('T')[0];

        // precise start/end datetimes
        const startDateTime = new Date(`${sessionDateStr}T${session.start_time}`); // ISO Time assumed HH:MM:SS
        const endDateTime = new Date(`${sessionDateStr}T${session.end_time}`);

        let liveStatus = 'UPCOMING';

        if (currentTimeMs > endDateTime.getTime()) {
            liveStatus = 'COMPLETED';
        } else if (currentTimeMs >= startDateTime.getTime() && currentTimeMs <= endDateTime.getTime()) {
            liveStatus = 'ONGOING';
        }

        // Display Logic Helper
        // If it's a past date, it's completed regardless of time
        if (new Date(sessionDateStr) < new Date(currentDateStr)) {
            liveStatus = 'COMPLETED';
        }

        return {
            ...session,
            live_status: liveStatus
        };
    });
}
