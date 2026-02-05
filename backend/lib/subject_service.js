/* ADDED BY ANTI-GRAVITY */
import { PostgresProvider } from '../providers/PostgresProvider.js';

const provider = new PostgresProvider();

/**
 * Single Source of Truth for Student Subject Resolution.
 * REFACTORED: Wrapper around DataProvider.
 * 
 * @param {string} sapid 
 * @returns {Promise<{student: Object, subjects: Array}>}
 */
export async function getSubjectsForStudent(sapid) {
    // 1. Get Student Context
    const student = await provider.getStudentProfile(sapid);

    if (!student) {
        throw new Error(`Student SAPID ${sapid} not found`);
    }

    // 2. Query Enrollments via Provider
    // Provider already handles normalization logic internally now.
    const subjects = await provider.getSubjectEnrollments(student.student_id);

    console.log(`[SubjectService] Resolved ${subjects.length} subjects for ${student.student_id}`);

    return {
        student: {
            ...student,
            normalized_program: student.program // Provider handles the complex logic, we just pass context
        },
        subjects: subjects
    };
}
