/* ADDED BY ANTI-GRAVITY: ProtectedRoute */
import React from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "../lib/session"; // ADDED BY ANTI-GRAVITY

export default function ProtectedRoute({ children }) {
    try {
        const { token } = getSession();
        if (!token) return <Navigate to="/" replace />;
        // Optional lightweight sanity: check token looks like JWT
        if (!token.split || token.split(".").length !== 3) {
            // invalid token format: remove it and force login
            try { localStorage.clear(); } catch (e) { /* ignore */ }
            return <Navigate to="/" replace />;
        }
        return children;
    } catch (e) {
        try { localStorage.clear(); } catch (e) { /* ignore */ }
        return <Navigate to="/" replace />;
    }
}
/* ADDED BY ANTI-GRAVITY: end */
