import React, { useState } from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BarChart2, LogOut, Menu, X, CalendarPlus, Info, TrendingUp, Award, Globe, Search } from 'lucide-react';
import { useStore } from '../context/Store';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { logout, user } = useStore();
    const { id } = useParams();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Fallback ID if useParams fails (rare case where Layout is outside param scope)
    const studentId = id || user?.id || window.location.pathname.split('/')[2];

    const activeClass = "text-nmims-primary bg-red-50 border-b-2 border-nmims-primary font-semibold";
    const baseClass = "flex items-center gap-2 px-4 py-3 text-gray-500 hover:text-nmims-primary hover:bg-gray-50 transition-all text-sm font-medium border-b-2 border-transparent";

    // Special Roles Check
    const isSpecialRole = ['director', 'event_coordinator', 'club_head', 'school_admin'].includes(user?.role);
    const isDirector = user?.role === 'director';

    return (
        <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 w-full z-50 shadow-sm">
            <div className="max-w-full mx-auto px-6 md:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Area */}
                    <div className="flex items-center gap-4">
                        {/* HAMBURGER MENU TRIGGER */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="flex items-center gap-2">
                            <img
                                src="/nmims-logo.png"
                                alt="NMIMS Logo"
                                className="h-12 w-auto object-contain"
                            />
                        </div>
                    </div>

                    {/* Desktop Menu - MOVED TO BURGER */}
                    <div className="hidden md:flex items-center gap-1 h-full">
                        {/* Clean Header */}
                    </div>

                    {/* User Profile / Logout */}
                    <div className="flex items-center gap-4">
                        <NotificationBell />

                        <div className="hidden md:block text-right">
                            {/* dynamic user info */}
                            <p className="text-sm font-medium text-gray-900">{user?.name || "Student"}</p>
                            <p className="text-xs text-gray-500">
                                {user?.role !== 'student' ? <span className="text-amber-600 font-bold uppercase">{user?.role?.replace('_', ' ')}</span> : `ID: ${studentId}`}
                            </p>
                        </div>
                        <img
                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${user?.name || "Student"}`}
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-slate-100"
                            alt="Profile"
                        />
                        <button onClick={logout} className="text-gray-400 hover:text-nmims-primary transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* SLIDE-OUT MENU (DRAWER) */}
            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={() => setIsMenuOpen(false)} />
                    <div className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-out border-r border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="font-bold text-lg text-slate-800">Menu</h2>
                            <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 space-y-1">
                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Navigation</div>
                            <NavLink to={`/student/${studentId}/dashboard`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-medium">
                                <LayoutDashboard size={20} className="text-slate-400" /> Dashboard
                            </NavLink>
                            <NavLink to={`/student/${studentId}/analytics`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-medium">
                                <BarChart2 size={20} className="text-slate-400" /> Analytics
                            </NavLink>
                            <NavLink to={`/student/${studentId}/portfolio`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-medium">
                                <Award size={20} className="text-slate-400" /> Portfolio
                            </NavLink>
                            <NavLink to={`/student/${studentId}/network`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-medium mb-4">
                                <Globe size={20} className="text-slate-400" /> Network
                            </NavLink>
                            <NavLink to={`/student/${studentId}/lost-found`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-medium mb-4">
                                <Search size={20} className="text-slate-400" /> Lost & Found
                            </NavLink>

                            <div className="border-t border-slate-100 my-2"></div>
                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">General</div>
                            <NavLink to={`/student/${studentId}/about`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-medium">
                                <Info size={20} className="text-slate-400" /> About NMIMS
                            </NavLink>

                            {/* SPECIAL ACCESS SECTION */}
                            {isSpecialRole && (
                                <>
                                    <div className="mt-6 px-4 py-2 text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        Admin Actions
                                    </div>
                                    <NavLink to={`/student/${studentId}/events/host`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-amber-50 rounded-xl transition-all font-medium group">
                                        <div className="p-1.5 bg-amber-100/50 text-amber-600 rounded-lg group-hover:bg-amber-200 transition-colors">
                                            <CalendarPlus size={18} />
                                        </div>
                                        Host New Event
                                    </NavLink>
                                    <NavLink to={`/student/${studentId}/events/my`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-amber-50 rounded-xl transition-all font-medium">
                                        <BookOpen size={20} className="text-slate-400 group-hover:text-amber-500" /> My Event Requests
                                    </NavLink>
                                </>
                            )}

                            {/* DIRECTOR ANALYTICS */}
                            {(isDirector || user?.role === 'admin') && (
                                <NavLink to={`/director/events/analytics`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-indigo-50 rounded-xl transition-all font-medium mt-1">
                                    <TrendingUp size={20} className="text-indigo-500" /> Event Analytics
                                </NavLink>
                            )}

                        </div>
                    </div>
                </>
            )}

            {/* Mobile Tabs */}
            <div className="md:hidden flex border-t border-gray-200 bg-white">
                <NavLink to={`/student/${studentId}/dashboard`} className="flex-1 py-3 flex justify-center text-gray-500 border-b-2 border-transparent aria-[current=page]:border-nmims-primary aria-[current=page]:text-nmims-primary">
                    <LayoutDashboard size={20} />
                </NavLink>
                <NavLink to={`/student/${studentId}/analytics`} className="flex-1 py-3 flex justify-center text-gray-500 border-b-2 border-transparent aria-[current=page]:border-nmims-primary aria-[current=page]:text-nmims-primary">
                    <BarChart2 size={20} />
                </NavLink>
            </div>
        </nav>
    );
};

const Layout = () => {
    return (
        <div className="min-h-screen bg-nmims-light">
            <Navbar />
            <main className="min-h-[calc(100vh-64px)] animate-fade-in w-full pb-8 pt-20">
                <Outlet />
                <footer className="mt-12 text-center text-xs text-slate-400 font-medium">
                    © {new Date().getFullYear()} SVKM's NMIMS Hyderabad. All rights reserved. <span className="mx-1">|</span> Developed by <strong>Dev Chalana</strong>
                </footer>
            </main>
        </div>
    );
};

export default Layout;
