/* ADDED BY ANTI-GRAVITY: apiClient.js */
export async function postLogin(sapid, password) {
    try {
        const res = await fetch("http://localhost:4000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sapid, password })
        });
        const data = await res.json();
        return { status: res.status, ok: res.ok, data };
    } catch (e) {
        return { status: 0, ok: false, data: { error: e.message } };
    }
}

export const API = {
    postLogin
};
/* ADDED BY ANTI-GRAVITY: end */
