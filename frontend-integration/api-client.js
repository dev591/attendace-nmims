const API_URL = 'http://localhost:4000';

export const apiClient = {
    // Login with SAPID
    login: async (sapid, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sapid, password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Login failed');
        }
        return res.json(); // { token, needs_course_selection, ... }
    },

    // Set Password
    setPassword: async (sapid, password) => {
        const res = await fetch(`${API_URL}/auth/set-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sapid, password })
        });
        return res.json();
    },

    // Set Course (if login returns needs_course_selection: true)
    setCourse: async (course_id, token) => {
        const res = await fetch(`${API_URL}/student/set-course`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ course_id })
        });
        return res.json();
    },

    // Get Dashboard
    getDashboard: async (student_id, token) => {
        const res = await fetch(`${API_URL}/student/${student_id}/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },

    // Get Courses List
    getCourses: async () => {
        const res = await fetch(`${API_URL}/courses`);
        return res.json();
    },

    // Import Attendance (Demo)
    importAttendance: async (filePath) => {
        const res = await fetch(`${API_URL}/import/attendance-csv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath })
        });
        return res.json();
    }
};
