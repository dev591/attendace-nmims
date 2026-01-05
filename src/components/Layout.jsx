import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BarChart2, LogOut } from 'lucide-react';
import { useStore } from '../context/Store';

const Navbar = () => {
    const { logout, user } = useStore();
    const params = React.useMemo(() => {
        // Fallback to getting ID from URL if store user is late
        // But store user should be there.
        // Actually, useParams hook is safer as we are inside the route.
        return window.location.pathname.split('/')[2];
    }, []);
    // Better: use useParams hook properly
    // But Layout is rendered by Outlet? No, Layout renders Outlet.
    // Layout is the parent route element.
    // Let's import useParams.

    // Actually simpler:
    const activeClass = "text-nmims-primary bg-red-50 border-b-2 border-nmims-primary font-semibold";
    const baseClass = "flex items-center gap-2 px-4 py-3 text-gray-500 hover:text-nmims-primary hover:bg-gray-50 transition-all text-sm font-medium border-b-2 border-transparent";

    // Grab ID from URL because "Layout" is the parent of "/student/:id"
    // Wait, Layout is rendered FOR "/student/:id".
    // So useParams() in Layout will return { id: "..." }.
    // Let's use that.

    // We need to import useParams first. 
    // Wait, I can't import useParams inside the component if I didn't import it in file.
    // I need to update the import statement too. Using window.location for now as quick fix or import it?
    // Let's stick to modifying the component properly, assuming I can add imports.
    // Ah, 'react-router-dom' imports are at top. I will update imports in next step.

    // For now, let's assume `window.location` or `useStore` has it.
    // `useStore().user?.id` is available.
    const studentId = user?.id || window.location.pathname.split('/')[2];

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Area */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-nmims-primary rounded flex items-center justify-center text-white font-bold text-lg">
                            N
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">NMIMS</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Attendance Portal</p>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-1 h-full">
                        <NavLink to={`/student/${studentId}/dashboard`} className={({ isActive }) => isActive ? activeClass : baseClass}>
                            <LayoutDashboard size={16} /> Dashboard
                        </NavLink>
                        <NavLink to={`/student/${studentId}/analytics`} className={({ isActive }) => isActive ? activeClass : baseClass}>
                            <BarChart2 size={16} /> Analytics
                        </NavLink>
                    </div>

                    {/* User Profile / Logout */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block text-right">
                            {/* dynamic user info */}
                            <p className="text-sm font-medium text-gray-900">{user?.name || "Student"}</p>
                            <p className="text-xs text-gray-500">ID: {studentId || "Unknown"}</p>
                        </div>
                        <img src={`https://ui-avatars.com/api/?name=${user?.name || "User"}&background=D50000&color=fff`} className="w-8 h-8 rounded-full border border-gray-200" alt="Profile" />
                        <button onClick={logout} className="text-gray-400 hover:text-nmims-primary transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>

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
            <main className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
