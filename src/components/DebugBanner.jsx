/* ADDED BY ANTI-GRAVITY: DebugBanner.jsx */
import React from "react";
import { getSession, clearSession } from "../lib/session"; // ADDED BY ANTI-GRAVITY

export default function DebugBanner() {
    // if (process.env.NODE_ENV !== "development") return null; // Un-comment if you only want this in dev
    const [, forceUpdate] = React.useState(0);

    // Poll for token changes to update specific banner
    React.useEffect(() => {
        const i = setInterval(() => forceUpdate(n => n + 1), 1000);
        return () => clearInterval(i);
    }, []);

    const { token, user_name } = getSession();

    if (!token) return null; // Don't show if logged out (optional preference)

    return (
        <div style={{ position: "fixed", bottom: 10, right: 10, zIndex: 9999, background: "#fff", padding: 8, border: "1px solid #ccc", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }}>DEBUG MODE</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace' }}>user: {user_name || "Unknown"}</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#888' }}>token: {token ? token.slice(0, 10) + "..." : "none"}</div>
            <button
                onClick={() => { clearSession(); window.location.href = "/"; }}
                style={{ marginTop: 6, background: '#eee', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
            >
                Logout (Force)
            </button>
        </div>
    );
}
/* ADDED BY ANTI-GRAVITY: end */
