import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Clock, Calendar, BookOpen, AlertTriangle, CheckCircle,
    TrendingUp, Award, Quote, ChevronRight, Zap, Target, Star, MapPin
} from 'lucide-react';
import ClassesTab from '../components/ClassesTab';

gsap.registerPlugin(ScrollTrigger);

const StudentDashboard = () => {
    const { data } = useStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (data.currentUser?.student_id) {
            fetchDashboardData();
            fetchNotifications();
        }
    }, [data.currentUser?.student_id]);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/student/dashboard/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setStats(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await fetch(`http://localhost:4000/notifications`, { headers });
            if (res.ok) {
                const json = await res.json();
                setNotifications(json.notifications);
                setUnreadCount(json.unread_count);
            }
        } catch (error) {
            console.error('Notifications error:', error);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            try {
                const token = localStorage.getItem('token');
                await fetch(`http://localhost:4000/notifications/${notif.id}/read`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (e) { console.error(e); }
        }
        if (notif.action_url) navigate(notif.action_url);
    };

    // --- ANIMATIONS ---
    useEffect(() => {
        // Hero
        gsap.fromTo(".hero-text",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.1 }
        );

        // Cards
        gsap.fromTo(".dash-card",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, delay: 0.2, stagger: 0.05, ease: "power2.out" }
        );

        // Sections
        gsap.utils.toArray(".dash-section").forEach(section => {
            gsap.fromTo(section,
                { opacity: 0, y: 30 },
                {
                    opacity: 1, y: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 90%",
                    }
                }
            )
        });
    }, []);

    const studentName = data.currentUser?.name?.split(' ')[0] || "Student";
    const attendance = data.weighted_pct || "0";
    const dangerCount = stats?.danger_subjects?.length || 0;
    const xp = stats?.xp || 0;
    const rank = stats?.rank || '-';

    const h = new Date().getHours();
    const greeting = h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32 overflow-x-hidden selection:bg-red-500 selection:text-white">

            {/* 1. HEADER section */}
            <div className="px-6 md:px-8 pt-10 pb-8 max-w-full mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <p className="hero-text text-sm font-bold text-slate-400 tracking-widest uppercase mb-2">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <h1 className="hero-text text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
                            {greeting}, <br />
                            <span className="text-red-600">{studentName}.</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* NOTIFICATIONS BELL (Connected) */}
                        <div className="relative group cursor-pointer hero-text">
                            <div className="bg-white p-3 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                {unreadCount > 0 && <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 animate-pulse border border-white"></span>}
                                <AlertTriangle size={20} className={unreadCount > 0 ? "text-red-500" : "text-slate-400"} />
                            </div>
                            {/* Hover Dropdown */}
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-0 hidden group-hover:block z-50 overflow-hidden">
                                <div className="p-3 border-b border-slate-100 font-bold text-slate-800 text-sm flex justify-between items-center">
                                    <span>Notifications</span>
                                    {unreadCount > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length > 0 ? notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <div className="flex gap-2">
                                                <div className={`w-2 h-2 mt-1.5 rounded-full ${!n.is_read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                                <div>
                                                    <div className={`text-sm ${!n.is_read ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{n.title}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</div>
                                                    <div className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-slate-400 text-sm">
                                            No notifications yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* XP PILL */}
                        <div className="hero-text bg-white border border-slate-200 rounded-full px-6 py-3 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/student/dashboard/analytics')}>
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Global Rank</span>
                                <span className="text-lg font-black text-slate-900">#{rank}</span>
                            </div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total XP</span>
                                <div className="text-lg font-black text-indigo-600">{xp.toLocaleString()}</div>
                            </div>
                            <div className="bg-indigo-50 p-2 rounded-full text-indigo-600">
                                <Award size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. STATS GRID (Normal Sized) */}
            <div className="px-6 md:px-8 max-w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* ATTENDANCE */}
                <div className="dash-card bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                            <TrendingUp size={16} /> Attendance
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${attendance >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {attendance >= 75 ? 'On Track' : 'Low'}
                        </div>
                    </div>
                    <div className="text-5xl font-black text-slate-900 tracking-tighter mb-1">
                        {attendance}%
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                        Average across all subjects
                    </div>
                </div>

                {/* STATUS */}
                <div className={`dash-card rounded-3xl p-6 border shadow-sm relative overflow-hidden flex flex-col justify-between ${dangerCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                            <AlertTriangle size={16} /> Risk Status
                        </div>
                    </div>
                    <div>
                        <div className={`text-3xl font-black tracking-tight mb-1 ${dangerCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                            {dangerCount > 0 ? `${dangerCount} Subjects` : "All Safe"}
                        </div>
                        <div className="text-sm text-slate-500">
                            {dangerCount > 0 ? "Requires immediate attention." : "You are in the safe zone."}
                        </div>
                    </div>
                </div>

                {/* DAILY QUESTS */}
                <div className="dash-card bg-slate-900 text-white rounded-3xl p-6 shadow-lg shadow-slate-200 relative overflow-hidden cursor-pointer group" onClick={() => navigate('/career-copilot')}>
                    <div className="absolute top-0 right-0 p-16 bg-indigo-500/20 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-indigo-500/30 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                                <Zap size={16} /> Daily Quests
                            </div>
                            <ChevronRight size={16} className="text-indigo-400" />
                        </div>
                        <div>
                            <div className="text-4xl font-black tracking-tight mb-1">
                                {stats?.daily_quests_pending || 0} <span className="text-lg font-medium text-slate-500">Pending</span>
                            </div>
                            <div className="text-sm text-slate-400">
                                Complete to earn XP
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. TIMETABLE (Normal Height, Full Width) */}
            <div className="dash-section px-6 md:px-8 max-w-full mx-auto mt-12" id="timetable-section">
                <div className="flex items-center gap-3 mb-6">
                    <BookOpen size={24} className="text-red-600" />
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Today's Schedule</h2>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-2">
                    <div className="p-4 md:p-6">
                        <ClassesTab studentId={data.currentUser?.student_id} token={localStorage.getItem('token')} />
                    </div>
                </div>
            </div>

            {/* 4. TROPHY ROOM (Horizontal Scroll, Normal Cards) */}
            <div className="dash-section mt-12 border-t border-slate-100 pt-12">
                <div className="px-6 md:px-8 max-w-full mx-auto flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Award size={24} className="text-amber-500" />
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Trophy Room</h2>
                    </div>
                    <button onClick={() => navigate('/achievements')} className="text-sm font-bold text-slate-500 hover:text-red-600 transition-colors">View All</button>
                </div>

                <div className="px-6 md:px-8 max-w-full mx-auto flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x">

                    {/* Rank Card - Normal Size */}
                    <div className="min-w-[200px] h-[220px] bg-white border border-slate-200 p-5 rounded-2xl snap-center flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white text-lg font-black mb-3">
                            #{rank}
                        </div>
                        <div className="font-bold text-slate-900">Global Rank</div>
                        <div className="text-xs text-slate-400 mt-1">Top 5% of Students</div>
                    </div>

                    {/* Badges - Normal Size */}
                    {stats?.badges?.length > 0 ? stats.badges.map((badge, i) => (
                        <div key={i} className="min-w-[160px] h-[220px] bg-gradient-to-b from-white to-slate-50 border border-slate-200 p-4 rounded-2xl snap-center flex flex-col items-center justify-center text-center shadow-sm hover:-translate-y-1 transition-transform">
                            <div className="text-4xl mb-3">{badge.icon || '🏅'}</div>
                            <div className="text-sm font-bold text-slate-800 leading-tight line-clamp-2">{badge.name}</div>
                            <div className="text-[10px] text-slate-400 mt-2 font-mono uppercase font-bold">+20 XP</div>
                        </div>
                    )) : (
                        <div className="min-w-[240px] h-[220px] flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 font-bold text-sm">
                            Start earning badges!
                        </div>
                    )}

                    {/* Next Goal - Normal Size */}
                    <div className="min-w-[200px] h-[220px] bg-indigo-600 p-5 rounded-2xl snap-center flex flex-col justify-between text-white relative overflow-hidden cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => navigate('/career-copilot')}>
                        <div className="relative z-10">
                            <Target size={24} className="text-indigo-200 mb-3" />
                            <div className="font-bold leading-tight">Next Goal</div>
                            <div className="text-xs text-indigo-200 mt-1">Complete "Resume Review"</div>
                        </div>
                        <div className="w-full bg-indigo-800/50 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-white h-full w-2/3"></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default StudentDashboard;

