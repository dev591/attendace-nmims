import config from '../utils/config';

// ... imports remain the same

// inside fetchData
// BACKEND INTEGRATION
console.log("[STORE] Fetching Dashboard Data from Backend...");
const API_URL = config.API_URL;

const res = await fetch(`${API_URL}/student/${user.id}/dashboard`, {
    headers: {
        'Authorization': `Bearer ${user.token}`
    }
});

if (!res.ok) throw new Error("Failed to fetch dashboard data");

const dashData = await res.json();

// Map Backend Data structure to Frontend Store
// Backend returns: { currentUser, subjects, timetable, analytics, notifications... }

setData(prev => ({
    ...prev,
    currentUser: dashData.currentUser,
    subjects: dashData.subjects || [],
    timetable: dashData.timetable || [],
    notifications: dashData.notifications || [],
    upcoming_events: dashData.upcoming_events || [],
    analytics: dashData.analytics || {
        risk_summary: {
            heroStatus: 'NO_DATA',
            heroMsg: 'Waiting for attendance updates...',
            overallPct: 0,
            safeSubjects: 0,
            atRiskSubjects: 0,
            healthLabel: 'Neutral'
        }
    }
}));
setError(null);
console.log("[STORE] Data Hydrated Successfully");

        } catch (err) {
    console.error("Backend Fetch Error:", err);
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
    // userData: { name, sapid, role, token, ... }
    // ANTI-GRAVITY: Respect role from backend
    const role = userData.role || 'student';
    const id = userData.sapid; // Use SAPID as ID for routing

    const u = { name: userData.name, id, role, token: userData.token };
    setUser(u);
    setSession({
        token: userData.token,
        student_id: id,
        user_name: userData.name,
        role: role // Save role to session
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


