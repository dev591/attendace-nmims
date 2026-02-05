/**
 * OracleMockProvider.js
 * Mock implementation of IDataProvider to simulate Oracle Data Source.
 * This proves the architecture is decoupled and Oracle-ready.
 */
import { IDataProvider } from './IDataProvider.js';

export class OracleMockProvider extends IDataProvider {
    constructor() {
        super();
        console.log(" [ORACLE] Initialized Mock Oracle Provider (Read-Only Mode)");
    }

    // --- STUDENT CONTEXT ---
    async getStudentProfile(sapid) {
        // Mock Response
        return {
            student_id: `ORA_${sapid}`,
            sapid: sapid,
            name: "Oracle Demo User",
            program: "engineering",
            dept: "cse",
            semester: 6,
            year: 3
        };
    }

    async getSubjectEnrollments(studentId) {
        return [
            { subject_code: 'ORA-DB', subject_name: 'Oracle Databases 101', subject_id: 'ORA_1', total_classes: 50, min_attendance_pct: 80, credits: 4 },
            { subject_code: 'ORA-CLOUD', subject_name: 'Oracle Cloud Infra', subject_id: 'ORA_2', total_classes: 40, min_attendance_pct: 75, credits: 3 }
        ];
    }

    async updateSessionStatus() {
        console.log(" [ORACLE] Syncing session status from Remote...");
        // No-op in mock
    }

    async getAttendanceMetrics(subjectIds, studentId) {
        // Mock Random Data
        return subjectIds.map(sid => ({
            subject_id: sid,
            conducted: 20,
            attended: 18, // 90% attendance
            total_planned: 50
        }));
    }

    async getRecentTrend(subjectIds, studentId) {
        return subjectIds.map(sid => ({
            subject_id: sid,
            recent_conducted: 5,
            recent_attended: 5 // Perfect streak
        }));
    }

    async getWeeklyHeatmap(studentId) {
        return [
            { day_name: 'Mon', total_classes: 2, attended: 2 },
            { day_name: 'Tue', total_classes: 1, attended: 1 },
            { day_name: 'Wed', total_classes: 0, attended: 0 },
        ];
    }

    // --- BADGES ---
    async getDetailedSessionHistory(studentId) { return []; }
    async awardBadge(studentId, badgeCode) { console.log(`[ORACLE] Mock Award Badge: ${badgeCode}`); }
    async getEarnedBadges(studentId) { return []; }
    async getAllBadges() { return []; }
    async markStudentDangerHistory(studentId) { }
}
