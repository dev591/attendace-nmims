/**
 * IDataProvider.js
 * Interface contract for Data Access Layer.
 * All providers (Postgres, Oracle, Mock) must implement these methods.
 * 
 * DESIGN PRINCIPLE:
 * Business logic should NEVER write SQL or know about the DB schema directly.
 * It should ask the provider for "Student Profile" or "Attendance Stats".
 */

export class IDataProvider {
    constructor() {
        if (this.constructor === IDataProvider) {
            throw new Error("Abstract class 'IDataProvider' cannot be instantiated directly.");
        }
    }

    // --- STUDENT CONTEXT ---
    async getStudentProfile(sapid) { throw new Error("Not Implemented"); }
    async getSubjectEnrollments(studentId) { throw new Error("Not Implemented"); }

    // --- TIMETABLE & SESSIONS ---
    /**
     * Marks past scheduled sessions as 'conducted'.
     * @returns {Promise<void>}
     */
    async updateSessionStatus() { throw new Error("Not Implemented"); }

    /**
     * Returns timetable for upcoming N days.
     */
    async getTimetable(studentId, days) { throw new Error("Not Implemented"); }

    // --- ANALYTICS METRICS ---
    /**
     * Returns aggregated attendance metrics for list of subjects.
     * @param {string[]} subjectIds 
     * @param {string} studentId 
     * @param {string} date - Reference date (usually today)
     */
    async getAttendanceMetrics(subjectIds, studentId) { throw new Error("Not Implemented"); }

    /**
     * Returns recent trend (last 5 sessions) for subjects.
     */
    async getRecentTrend(subjectIds, studentId) { throw new Error("Not Implemented"); }

    /**
     * Returns weekly heatmap data.
     */
    async getWeeklyHeatmap(studentId) { throw new Error("Not Implemented"); }

    // --- BADGES ---
    /**
     * Returns raw session history for badge evaluation.
     */
    async getDetailedSessionHistory(studentId) { throw new Error("Not Implemented"); }

    async getBadgeContext(studentId) { throw new Error("Not Implemented"); }
    async awardBadge(studentId, badgeCode) { throw new Error("Not Implemented"); }
    async getEarnedBadges(studentId) { throw new Error("Not Implemented"); }
    async getAllBadges() { throw new Error("Not Implemented"); }
    async markStudentDangerHistory(studentId) { throw new Error("Not Implemented"); }

    // --- ONE TAP DETAIL ---
    async getSubjectDetails(studentId, subjectId) { throw new Error("Not Implemented"); }
}
