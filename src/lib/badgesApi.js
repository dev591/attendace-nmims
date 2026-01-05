/* ADDED BY ANTI-GRAVITY */
export async function getStudentBadges(studentId, token) {
    const res = await fetch(`http://localhost:4000/badges/student/${studentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.json();
}
export async function getAllBadges(token) {
    const res = await fetch(`http://localhost:4000/badges`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.json();
}
export async function triggerBadgeEval(token) {
    const res = await fetch(`http://localhost:4000/badges/evaluate`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' } });
    return res.json();
}
