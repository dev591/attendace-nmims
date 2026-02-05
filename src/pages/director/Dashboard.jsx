import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/Store';
import {
    Activity, Search, Filter, Users, AlertTriangle, Calendar,
    TrendingUp, School, Download, ArrowRight, GraduationCap, Shield
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import DirectorHeatmaps from './DirectorHeatmaps';

export default function DirectorDashboard() {
    const { user } = useStore();
    const navigate = useNavigate();
    const containerRef = useRef(null);

    // State
    const [searchId, setSearchId] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [stats, setStats] = useState({
        kpi: { students: 0, at_risk: 0, live_classes: 0, faculty: 0 },
        distribution: [],
        trends: [],
        dailyOps: { scheduled: 0, conducted: 0, cancelled: 0 },
        facultyLoad: []
    });
    const [defaulters, setDefaulters] = useState([]);
    const [loading, setLoading] = useState(true);

    const departments = ['All', 'Computer', 'IT', 'AI/DS', 'EXTC', 'Mechanical'];
    const API_URL = config.API_URL;

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const headers = { 'Authorization': `Bearer ${token}` };

                // Parallel Fetch
                const [statsRes, defaultersRes, facultyRes, opsRes] = await Promise.all([
                    fetch(`${API_URL}/director/stats?dept=${filterDept}`, { headers }),
                    fetch(`${API_URL}/director/students/defaulters?dept=${filterDept}`, { headers }),
                    fetch(`${API_URL}/director/faculty-load`, { headers }),
                    fetch(`${API_URL}/director/daily-ops`, { headers })
                ]);

                const statsData = await statsRes.json();
                const defaultersData = await defaultersRes.json();
                const facultyData = await facultyRes.json();
                const opsData = await opsRes.json();

                setStats(prev => ({
                    ...prev,
                    ...statsData, // kpi, distribution, trends
                    facultyLoad: facultyData,
                    dailyOps: opsData
                }));
                setDefaulters(defaultersData);
                setLoading(false);

            } catch (error) {
                console.error("Director Dashboard Fetch Error:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [filterDept]); // Re-fetch when dept filter changes

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchId.trim()) {
            navigate(`/director/student/${searchId.trim()}`);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="p-8 max-w-full mx-auto space-y-8 pb-20 min-h-screen bg-gray-50/50">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Academic Pulse</h1>
                    <div className="flex items-center gap-2 text-green-600 mt-1 text-sm font-bold animate-pulse">
                        <Activity size={16} />
                        Campus is Live
                    </div>
                </div>

                {/* Director Actions Panel */}
                <div className="flex items-center gap-6">
                    {/* Student Lookup */}
                    <div className="relative hidden md:block group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Enter Student SAPID..."
                            className="bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>

                    <button
                        onClick={() => navigate('/director/audit')}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 tooltip group relative"
                        title="System Audit Logs"
                    >
                        <Shield size={20} />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            Audit Logs
                        </span>
                    </button>

                    {/* Profile Badge */}
                    <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full border border-gray-100 shadow-sm">
                        <img
                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${user?.name || "Director"}`}
                            className="h-10 w-10 rounded-full border border-gray-200 bg-red-50"
                            alt="Profile"
                        />
                        <div className="text-sm">
                            <div className="font-bold text-gray-900">{user?.name || 'Director'}</div>
                            <div className="text-xs text-gray-500">{user?.sapid}</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm mr-2 text-gray-500 text-sm font-medium">
                    <Filter size={16} /> Filter Scope:
                </div>
                {departments.map(dept => (
                    <button
                        key={dept}
                        onClick={() => setFilterDept(dept)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filterDept === dept
                            ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 scale-105'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                            }`}
                    >
                        {dept}
                    </button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Live Sessions"
                    value={stats.kpi.live_classes || 0}
                    icon={Activity}
                    color="green"
                    isLive
                    subtext="Ongoing classes right now"
                />

                {/* Total Enrollment Card */}
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users size={24} />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total Enrollment</h3>
                    <div className="text-4xl font-bold text-gray-900 tracking-tight mb-4">{stats.kpi.students}</div>

                    {/* Mini Breakdown */}
                    <div className="space-y-2 pt-3 border-t border-gray-100">
                        {stats.distribution.slice(0, 3).map((d, i) => (
                            <div key={i} className="flex justify-between text-xs text-gray-600">
                                <span className="font-semibold">{d.name}</span>
                                <span>{d.value}</span>
                            </div>
                        ))}
                        {stats.distribution.length > 3 && (
                            <div className="text-xs text-blue-500 font-bold mt-1">+ {stats.distribution.length - 3} more depts</div>
                        )}
                    </div>
                </div>

                <StatCard
                    title="At Risk (<75%)"
                    value={stats.kpi.at_risk}
                    icon={AlertTriangle}
                    isAlert
                    subtext="Requires Immediate Intervention"
                    color="red"
                />
                <StatCard
                    title="Timetable Adherence"
                    value={`${stats.dailyOps?.conducted || 0} / ${stats.dailyOps?.scheduled || 0}`}
                    icon={Calendar}
                    color="purple"
                    subtext={`Classes conducted today`}
                />
            </div>

            {/* Strategic Heatmaps */}
            <DirectorHeatmaps />

            {/* Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart: Trends */}
                <section className="chart-section lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp size={18} className="text-gray-400" /> Attendance Trends (6 Months)
                        </h3>
                        <div className="flex gap-2">
                            <span className="h-3 w-3 rounded-full bg-red-500"></span>
                            <span className="text-xs text-gray-500">Avg Attendance</span>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.trends}>
                                <defs>
                                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#fca5a5', strokeWidth: 1 }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Distribution / Quick Actions */}
                <section className="chart-section bg-gradient-to-br from-gray-900 to-slate-800 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
                    {/* Decorative BG */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <School size={18} className="text-gray-400" /> Dept. Distribution
                        </h3>
                        <div className="space-y-5">
                            {stats.distribution.map((d, i) => (
                                <div key={i} className="group cursor-default">
                                    <div className="flex justify-between text-sm mb-1 opacity-80 group-hover:opacity-100 transition-opacity font-medium">
                                        <span>{d.name}</span>
                                        <span>{d.value}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${(d.value / Math.max(1, stats.kpi.students)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm z-10 relative group">
                        <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> Export Detailed Report
                    </button>
                </section>
            </div>

            {/* Split Section: Defaulters & Faculty Load */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Critical Defaulters */}
                <section className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden chart-section">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-red-500" />
                            Critical Defaulters
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">{defaulters.length}</span>
                        </h2>
                        <a href="/director/students" className="text-sm text-red-600 font-medium hover:underline flex items-center gap-1 cursor-pointer">
                            View All <ArrowRight size={16} />
                        </a>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 bg-white">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Year</th>
                                    <th className="px-6 py-4 text-right">Attendance %</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {defaulters.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-400">✅ All Clear! No students at risk.</td></tr>
                                ) : (
                                    defaulters.slice(0, 5).map(d => (
                                        <tr key={d.sapid} className="defaulters-row hover:bg-red-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{d.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{d.sapid}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium text-xs border border-gray-200">{d.dept}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 hover:text-gray-900">{d.year}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-red-600">{d.pct}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-gray-400 hover:text-red-600 font-medium text-xs opacity-0 group-hover:opacity-100 transition-all">
                                                    Notify
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Faculty Workload */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden chart-section">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <GraduationCap size={20} className="text-indigo-600" /> Top Faculty Load
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">Based on Timetable Excel</p>
                    </div>
                    <div className="p-4 space-y-4">
                        {stats.facultyLoad?.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                        {f.faculty_name?.[0]}
                                    </div>
                                    <div className="text-sm font-bold text-gray-700">{f.faculty_name}</div>
                                </div>
                                <div className="text-sm font-bold text-gray-900">{f.total_sessions} <span className="text-gray-400 text-xs font-normal">Classes</span></div>
                            </div>
                        ))}
                        {(!stats.facultyLoad || stats.facultyLoad.length === 0) && (
                            <div className="text-center text-gray-400 text-sm py-4">No Faculty Data Found</div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/30">
                        <button className="w-full text-xs font-bold text-indigo-600 hover:text-indigo-800">View Full Roster</button>
                    </div>
                </section>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, subtext, color, isAlert, isLive }) {
    return (
        <div className={`stat-card relative p-6 rounded-2xl border transition-all hover:shadow-lg group ${isAlert
            ? 'bg-red-600 border-red-500 shadow-red-200 text-white' // Bold Red Background
            : 'bg-white border-gray-100'
            }`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl transition-colors ${isAlert ? 'bg-red-500/50 text-white' :
                    isLive ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600 group-hover:bg-gray-900 group-hover:text-white'
                    }`}>
                    <Icon size={isLive ? 20 : 24} className={isLive ? 'animate-pulse' : ''} />
                </div>
                {isAlert && <span className="animate-pulse h-3 w-3 rounded-full bg-white shadow-lg"></span>}
                {isLive && <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>}
            </div>

            <h3 className={`text-sm font-medium mb-1 ${isAlert ? 'text-red-100' : 'text-gray-500'}`}>{title}</h3>

            <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold tracking-tight ${isAlert ? 'text-white' : 'text-gray-900'}`}>{value}</span>
            </div>

            {(trend || subtext) && (
                <p className={`text-xs mt-3 font-medium ${isAlert ? 'text-red-100 opacity-90' : 'text-gray-400'}`}>
                    {trend || subtext}
                </p>
            )}
        </div>
    );
}
