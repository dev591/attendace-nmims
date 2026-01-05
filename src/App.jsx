import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import StudentDashboard from './pages/StudentDashboard';
import SubjectDetail from './pages/SubjectDetail';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import AdminSchedule from './pages/AdminSchedule';
import CourseInfo from './pages/CourseInfo';
import ScanQR from './pages/ScanQR'; // Assuming this exists
import Profile from './pages/Profile'; // Assuming this exists
import { StoreProvider } from './context/Store';

import ProtectedRoute from './components/ProtectedRoute';
import DebugBanner from './components/DebugBanner';

function App() {
    // ADDED BY ANTI-GRAVITY: debug
    React.useEffect(() => {
        const token = localStorage.getItem("token");
        console.log("[FRONTEND DEBUG] App Mount. Token present?", !!token);
    }, []);

    return (
        <Router>
            <StoreProvider>
                <Routes>
                    <Route path="/login" element={<Landing />} />
                    <Route path="/admin/login" element={<AdminLogin />} />

                    <Route path="/student/:id" element={<Layout />}>
                        <Route index element={<StudentDashboard />} />
                        <Route path="dashboard" element={<StudentDashboard />} /> {/* ADDED: Alias for strict links */}
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="scan" element={<ScanQR />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="subject/:subId" element={<SubjectDetail />} />
                        <Route path="course-info" element={<CourseInfo />} /> {/* ADDED */}
                    </Route>

                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/admin/dashboard" element={<Admin />} />
                    <Route path="/admin/schedule" element={<AdminSchedule />} />

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </StoreProvider>
        </Router>
    );
}

export default App;
