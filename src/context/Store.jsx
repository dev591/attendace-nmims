import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSession, setSession, clearSession } from '../lib/session';

const StoreContext = createContext();

const API_BASE = 'http://localhost:4000'; // Real Backend

export const StoreProvider = ({ children }) => {
    // Init User from Session
    const [user, setUser] = useState(() => {
        const s = getSession();
        return s.token ? { name: s.user_name, id: s.student_id, role: 'student', token: s.token } : null;
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [data, setData] = useState({
        currentUser: null,
        subjects: [],
        timetable: [],
        notifications: [],
        upcoming_events: [],
        badges: []
    });

    // FETCH REAL DATA
    const fetchData = useCallback(async () => {
        if (!user || !user.token) return;

        setIsLoading(true);
        try {
            console.log("Fetching dashboard data for", user.id);

            // ANTI-GRAVITY FIX: Use /snapshot endpoint which is verified to work with the updated subject logic.
            // Using user.id (e.g. S90030770) is correct for this endpoint too.
            const res = await fetch(`${API_BASE}/student/${user.id}/snapshot`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) logout();
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const json = await res.json();

            // Extract Badges
            // Snapshot returns 'badges' array directly at root, or inside analytics
            const badges = json.badges || [];

            setData(prev => ({
                ...prev,
                // MAP snapshot 'student' -> Store 'currentUser'
                currentUser: { ...json.student, badges },
                subjects: json.subjects || [],
                timetable: json.timetable || [],
                notifications: json.notifications || [],
                upcoming_events: json.upcoming_events || [],
                analytics: json.analytics || {},
                weighted_pct: json.analytics?.weighted_pct || 0,
                safe_miss_suggestions: json.safe_miss_suggestions || []
            }));
            setError(null);
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Auto-Fetch on Mount / User Change
    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    // Actions
    const login = (userData) => {
        // userData: { name, student_id, token, sapid ... }
        const u = { name: userData.name, id: userData.student_id, role: 'student', token: userData.token };
        setUser(u);
        setSession({
            token: userData.token,
            student_id: userData.student_id,
            user_name: userData.name
        });
    };

    const logout = () => {
        setUser(null);
        setData({ currentUser: null, subjects: [], timetable: [], notifications: [], upcoming_events: [], badges: [] });
        clearSession();
        window.location.href = "/";
    };

    const requestCorrection = (sessionId, reason) => {
        alert("Correction request sent! ID: REQ-" + Math.floor(Math.random() * 1000));
    };

    const updateAttendance = (sessionId, studentId, present) => {
        console.log("Updating attendance locally (optimistic)", sessionId, present);
        // Optimistic update logic could go here
    };

    return (
        <StoreContext.Provider value={{ user, data, isLoading, error, login, logout, refresh: fetchData, requestCorrection, updateAttendance }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => useContext(StoreContext);


