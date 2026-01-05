/* ADDED BY ANTI-GRAVITY */
export function getSession() {
    try {
        const token = localStorage.getItem("token");
        const student_id = localStorage.getItem("student_id");
        const user_name = localStorage.getItem("user_name");
        return { token, student_id, user_name };
    } catch (e) {
        return { token: null, student_id: null, user_name: null };
    }
}

export function setSession({ token, student_id, user_name }) {
    try {
        if (token) localStorage.setItem("token", token);
        if (student_id) localStorage.setItem("student_id", student_id);
        if (user_name) localStorage.setItem("user_name", user_name);
    } catch (e) { console.error("Session set failed", e); }
}

export function clearSession() {
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("student_id");
        localStorage.removeItem("user_name");
    } catch (e) { }
}
/* ADDED BY ANTI-GRAVITY: end */
