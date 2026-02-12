import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Home from './pages/Home';
import StudentDashboard from './pages/StudentDashboard';
import SubjectDetail from './pages/SubjectDetail';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import AdminSchedule from './pages/AdminSchedule';
import CourseInfo from './pages/CourseInfo';
import ScanQR from './pages/ScanQR';
import Profile from './pages/Profile';
import Timetable from './pages/Timetable'; // NEW
import AdminDashboard from './pages/admin/AdminDashboard'; // Import new dashboard
import { StoreProvider } from './context/Store';
import { SocketProvider } from './context/SocketContext';
import SmoothScroll from './components/SmoothScroll';
import PageTransition from './components/PageTransition';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // ADDED BY ANTI-GRAVITY
import { AnimatePresence } from 'framer-motion'; // ADDED BY ANTI-GRAVITY

// Director Imports
import DirectorLayout from './components/DirectorLayout';
import DirectorDashboard from './pages/director/Dashboard';
import StudentsList from './pages/director/StudentsList';
import FacultyList from './pages/director/FacultyList';
import Announcements from './pages/director/Announcements';
import EventAnalytics from './pages/director/EventAnalytics'; // NEW
import HostEvent from './pages/events/HostEvent'; // NEW
import AboutNMIMS from './pages/AboutNMIMS'; // NEW
import SystemAudit from './pages/director/SystemAudit'; // ADDED BY ANTI-GRAVITY

import MyEvents from './pages/events/MyEvents'; // New placeholder for "My Events"
import AppealsDashboard from './pages/director/AppealsDashboard'; // ADDED BY ANTI-GRAVITY
import Achievements from './pages/Achievements'; // NEW - Student
import DirectorVerify from './pages/director/DirectorVerify'; // NEW - Director
import Portfolio from './pages/Portfolio'; // ADDED BY ANTI-GRAVITY
import SocialFeed from './pages/SocialFeed'; // ADDED BY ANTI-GRAVITY
import Network from './pages/Network'; // ADDED BY ANTI-GRAVITY
import UserProfile from './pages/UserProfile'; // ADDED BY ANTI-GRAVITY
import Chat from './components/Chat'; // ADDED BY ANTI-GRAVITY
import OnboardingWizard from './pages/OnboardingWizard'; // ADDED BY ANTI-GRAVITY
// Duplicates removed
import CareerCoach from './pages/CareerCoach'; // ADDED BY ANTI-GRAVITY
import DirectorStudentProfile from './pages/director/DirectorStudentProfile'; // NEW
import LostFound from './pages/LostFound'; // ADDED BY ANTI-GRAVITY
import SecurityDashboard from './pages/security/SecurityDashboard'; // ADDED BY ANTI-GRAVITY

import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes cache
            refetchOnWindowFocus: false, // Don't refetch on tab switch (save bandwidth)
        },
    },
});

function App() {
    React.useEffect(() => {
        const token = localStorage.getItem("token");
        console.log("[FRONTEND DEBUG] App Mount. Token present?", !!token);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <AuthProvider>
                    <StoreProvider>
                        <SocketProvider>
                            <SmoothScroll>
                                <AnimatePresence mode='wait'>
                                    <PageTransition>
                                        <Routes>
                                            {/* Public Routes */}
                                            <Route path="/" element={<Home />} />
                                            <Route path="/login" element={<Landing />} />
                                            <Route path="/onboarding" element={<OnboardingWizard />} /> {/* NEW */}
                                            {/* Admin Routes */}
                                            <Route path="/admin/login" element={<AdminLogin />} />
                                            <Route path="/admin/dashboard" element={<AdminDashboard />} />

                                            {/* Director Routes */}
                                            <Route path="/director" element={<DirectorLayout />}>
                                                <Route index element={<DirectorDashboard />} />
                                                <Route path="dashboard" element={<DirectorDashboard />} />
                                                <Route path="students" element={<StudentsList />} />
                                                <Route path="faculty" element={<FacultyList />} />
                                                <Route path="announcements" element={<Announcements />} />
                                                <Route path="events/analytics" element={<EventAnalytics />} />
                                                <Route path="appeals" element={<AppealsDashboard />} />
                                                <Route path="verify" element={<DirectorVerify />} />
                                                <Route path="student/:sapid" element={<DirectorStudentProfile />} /> {/* NEW */}
                                                <Route path="audit" element={<SystemAudit />} /> {/* NEW: AUDIT LOGS */}
                                            </Route>

                                            {/* Student Routes */}
                                            <Route path="/student/:id" element={<Layout />}>
                                                <Route index element={<StudentDashboard />} />
                                                <Route path="dashboard" element={<StudentDashboard />} />
                                                <Route path="timetable" element={<Timetable />} /> {/* NEW */}
                                                <Route path="analytics" element={<Analytics />} />
                                                <Route path="scan" element={<ScanQR />} />
                                                <Route path="profile" element={<Profile />} />
                                                <Route path="subject/:subId" element={<SubjectDetail />} />
                                                <Route path="course-info" element={<CourseInfo />} />

                                                {/* EVENTS & ABOUT */}
                                                <Route path="about" element={<AboutNMIMS />} />
                                                <Route path="events/host" element={<HostEvent />} />
                                                <Route path="events/my" element={<MyEvents />} />
                                                <Route path="achievements" element={<Achievements />} />
                                                <Route path="portfolio" element={<Portfolio />} />
                                                <Route path="network" element={<Network />} />
                                                <Route path="feed" element={<SocialFeed />} /> {/* NEW: Social Feed */}
                                                <Route path="chat" element={<Chat />} /> {/* NEW: Chat */}
                                                <Route path="network/profile/:sapid" element={<UserProfile />} />
                                                <Route path="lost-found" element={<LostFound />} /> {/* NEW */}
                                            </Route>

                                            {/* Standalone Pages */}
                                            <Route path="/career-copilot" element={<CareerCoach />} />

                                            {/* Security Head Route */}
                                            <Route path="/security/dashboard" element={<SecurityDashboard />} />

                                            {/* Admin Routes */}
                                            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                                            {/* REMOVED DUPLICATE Route path="/admin/dashboard" element={<Admin />} */}
                                            <Route path="/admin/schedule" element={<AdminSchedule />} />

                                            {/* Fallback */}
                                            <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                    </PageTransition>
                                </AnimatePresence>
                            </SmoothScroll>
                        </SocketProvider>
                    </StoreProvider>
                </AuthProvider>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
