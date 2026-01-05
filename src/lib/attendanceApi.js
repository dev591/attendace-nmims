/* ADDED BY ANTI-GRAVITY */
// src/lib/attendanceApi.js
const BASE_URL = 'http://localhost:4000'; // Or use configs

export async function getStudentOverview(studentId, token) {
    const res = await fetch(`${BASE_URL}/student/${studentId}/attendance-overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function getSubjectAnalytics(studentId, subjectId, token) {
    const res = await fetch(`${BASE_URL}/student/${studentId}/subject/${subjectId}/attendance-analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
