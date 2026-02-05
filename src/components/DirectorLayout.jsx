
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, GraduationCap, Megaphone, Gavel, Award } from 'lucide-react';
import { useStore } from '../context/Store';

export default function DirectorLayout() {
    const { logout, user } = useStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // ANTI-GRAVITY: Route Guard
    React.useEffect(() => {
        if (user && user.role !== 'director') {
            console.warn("Unauthorized Director Access Attempt");
            navigate('/');
        }
    }, [user, navigate]);

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-center gap-3">
                    <img
                        src="/nmims-logo.png"
                        alt="NMIMS"
                        className="h-12 w-auto object-contain"
                    />
                    <span className="text-gray-400 font-normal text-sm border-l border-gray-200 pl-3">Director</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavLink to="/director/dashboard" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <LayoutDashboard size={18} /> Dashboard
                    </NavLink>
                    <NavLink to="/director/students" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Users size={18} /> Students
                    </NavLink>
                    <NavLink to="/director/faculty" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <GraduationCap size={18} /> Faculty
                    </NavLink>
                    <NavLink to="/director/announcements" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Megaphone size={18} /> Announcements
                    </NavLink>
                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <NavLink to="/director/appeals" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <Gavel size={18} /> Condonation
                        </NavLink>
                        <NavLink to="/director/verify" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <Award size={18} /> Verify Achievements
                        </NavLink>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="mb-4 px-4">
                        <p className="text-sm font-semibold text-gray-900">{user?.name || 'Director'}</p>
                        <p className="text-xs text-gray-500">{user?.sapid}</p>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto pb-8">
                <Outlet />
                <footer className="mt-12 text-center text-xs text-gray-400 font-medium pb-6">
                    © {new Date().getFullYear()} SVKM's NMIMS Hyderabad. <span className="mx-1">|</span> Developed by <strong>Dev Chalana</strong>
                </footer>
            </main>
        </div>
    );
}
