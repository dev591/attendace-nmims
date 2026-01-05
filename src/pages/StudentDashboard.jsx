import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/Store';
import {
    AlertTriangle, Clock, ArrowRight, Zap,
    BookOpen, RefreshCw, BarChart2, Bell,
    Cpu, Activity, Terminal, Layers, Code, Hash, Loader2, AlertCircle, ShieldCheck
} from 'lucide-react';
import { applyTheme, normalizeProgram } from '../lib/theme';
import FloatingElements from '../components/FloatingElements';
import { motion } from 'framer-motion';

import AchievementsSection from '../components/AchievementsSection';
// --- SUB-COMPONENTS FOR ENGINEERING THEME ---

const TechCard = ({ children, className = "", onClick, danger = false }) => (
    <motion.div
        whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClick}
        className={`
            bg-white border rounded-xl relative overflow-hidden group cursor-default transition-colors
            ${danger ? 'border-red-200' : 'border-gray-200 hover:border-cyan-300'}
            ${className}
            ${onClick ? 'cursor-pointer' : ''}
        `}
    >
        {/* Tech Corner Marker */}
        <div className={`absolute top-0 right-0 w-3 h-3 border-t border-r rounded-tr-md transition-colors ${danger ? 'border-red-400' : 'border-cyan-400 opacity-50 group-hover:opacity-100'}`}></div>
        {children}
    </motion.div>
);

const CpuProgressBar = ({ percent, label, danger = false }) => (
    <div className="w-full">
        <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-1 text-gray-500">
            <span>{label}</span>
            <span className={danger ? 'text-red-600' : 'text-cyan-600'}>{percent}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-sm overflow-hidden flex gap-0.5">
            {[...Array(20)].map((_, i) => {
                const active = (i + 1) * 5 <= percent;
                return (
                    <div
                        key={i}
                        className={`
                            flex-1 rounded-sm transition-all duration-300
                            ${active
                                ? (danger ? 'bg-red-500' : (percent >= 75 ? 'bg-green-500' : 'bg-amber-400'))
                                : 'bg-transparent'
                            }
                        `}
                    />
                );
            })}
        </div>
    </div>
);

const EngineeringHero = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 md:p-10 text-white overflow-hidden shadow-2xl"
    >
        {/* Abstract Tech Background */}
        <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="max-w-xl">
                <div className="flex items-center gap-2 text-cyan-400 mb-2 font-mono text-xs">
                    <Terminal size={14} />
                    <span>SYSTEM.MSG_OF_DAY</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight mb-2">
                    "Engineers solve problems you didn't know you had."
                </h1>
                <p className="text-gray-400 text-sm">Optimize your attendance algorithm today.</p>
            </div>

            {/* Animated Abstract Widget */}
            <div className="hidden md:flex gap-3">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-2 border-dashed border-cyan-500/30 rounded-full flex items-center justify-center"
                >
                    <div className="w-10 h-10 border border-white/20 rounded-full"></div>
                </motion.div>
                <div className="flex flex-col justify-center gap-1">
                    <div className="h-1 w-12 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-cyan-500" animate={{ width: ["0%", "100%", "0%"] }} transition={{ duration: 3, repeat: Infinity }} />
                    </div>
                    <div className="h-1 w-8 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-red-500" animate={{ width: ["0%", "100%", "0%"] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }} />
                    </div>
                    <div className="h-1 w-10 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-green-500" animate={{ width: ["0%", "100%", "0%"] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1 }} />
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
);

const StudentDashboard = () => {
    const { data, isLoading } = useStore();
    const navigate = useNavigate();
    const [expandSubjects, setExpandSubjects] = React.useState(false);

    // Data Prep
    const [greeting, setGreeting] = React.useState('Hello');

    // BACKEND DRIVEN STATS STATE
    const [stats, setStats] = React.useState({
        avg_attendance: 0,
        momentum: 0,
        is_all_safe: true,
        danger_subjects: [],
        total_conducted: 0
    });

    // Derived Confidence (for UI Color/Text)
    const getConfidenceLabel = () => {
        const n = stats.total_conducted || 0;
        if (n < 3) return { text: 'NOT ENOUGH DATA', color: 'text-gray-500', bg: 'bg-gray-100' };
        if (n <= 10) return { text: 'MODERATE', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { text: 'HIGH', color: 'text-green-600', bg: 'bg-green-100' };
    };
    const conf = getConfidenceLabel();

    React.useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        if (data.currentUser?.student_id) {
            fetchDashboardData();
        }
    }, [data.currentUser?.student_id]);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const statsRes = await fetch(`http://localhost:5000/student/${data.currentUser.student_id}/dashboard-stats`, { headers });
            const statsData = await statsRes.json();
            if (statsData) setStats(statsData);
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        }
    };

    const weightedAvg = data.weighted_pct || 0;
    const subjects = data.subjects || [];
    const timetable = data.timetable || [];
    const showSmartAlert = data.upcoming_class_alert;

    // Theme Effect
    React.useEffect(() => {
        const p = data.currentUser?.program || data.currentUser?.course_id || "";
        const prog = normalizeProgram(p);
        applyTheme(prog);
    }, [data.currentUser?.program, data.currentUser?.course_id]);

    // Stagger Container
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 max-w-7xl mx-auto relative font-sans text-gray-800"
        >
            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>


            <FloatingElements />

            {/* 1. ENGINEERING HERO */}
            <EngineeringHero />

            {/* 2. BADGE STRIP (Dynamic & Engineering Themed) */}
            {/* 2. ACHIEVEMENTS (Replacing old pill strip) */}
            <div className="mb-8">
                <AchievementsSection badges={data.currentUser?.badges || []} />
            </div>

            {/* 4. WORAYYY BANNER (BACKEND DRIVEN) */}
            {/* 4. WORAYYY BANNER (BACKEND DRIVEN) */}
            <div className="mb-8">
                {stats.is_all_safe ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg flex items-center gap-3"
                    >
                        <div className="bg-white/20 p-2 rounded-full">
                            <Zap size={20} className="text-white" fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Worayyy! You are fully safe</h3>
                            <p className="text-emerald-50 text-xs">No subjects in the risk zone. Keep it up!</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border-l-4 border-red-500 rounded-xl p-4 shadow-sm flex items-start gap-3"
                    >
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <div>
                            <h3 className="font-bold text-gray-800">Attention Required</h3>
                            <p className="text-gray-500 text-xs mt-1">
                                You are in the risk zone for: <span className="font-bold text-red-600">{(stats.danger_subjects || []).join(', ')}</span>
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
            {/* 2. DANGER ZONE / RECOVERY PANEL (Only if Needed) */}
            {subjects.some(s => s.academic_indicators?.danger_zone) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle size={20} className="text-red-600" />
                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Recovery Plan</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subjects.filter(s => s.academic_indicators?.danger_zone).map(subject => {
                            const details = subject.academic_indicators.danger_details;
                            return (
                                <div key={subject.subject_id} className="bg-white border-l-4 border-l-red-500 border-y border-r border-gray-200 rounded-r-xl p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-gray-900 text-md">{subject.subject_name}</div>
                                            <div className="text-xs font-mono text-gray-500 uppercase">{subject.subject_code}</div>
                                        </div>
                                        <div className="text-xl font-bold text-red-600 font-mono">
                                            {details?.current_pct}%
                                        </div>
                                    </div>

                                    <div className="bg-red-50 rounded-lg p-3 text-sm">
                                        <div className="flex gap-2 items-center text-red-800 font-bold mb-1">
                                            <TrendingDown size={16} />
                                            <span>Action Required</span>
                                        </div>
                                        <p className="text-red-700 leading-snug">
                                            Attend the next <strong className="text-red-900 text-lg">{details?.classes_needed_to_recover}</strong> classes
                                            to reach the <span className="font-mono font-bold">{details?.mandatory_pct}%</span> safe zone.
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ... */}
                {/* LEFT COL (Stats + Subjects) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* STATS ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. TOTAL SUBJECTS */}
                        <TechCard className="p-4 flex flex-col justify-between h-28">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">ENROLLED</p>
                                    <h3 className="text-3xl font-bold text-gray-800 mt-1">{subjects.length}</h3>
                                </div>
                                <BookOpen className="text-cyan-500 opacity-80" size={20} />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-auto font-mono">ACTIVE COURSE LOAD</p>
                        </TechCard>

                        {/* 2. SAFE SUBJECTS */}
                        <TechCard className="p-4 flex flex-col justify-between h-28">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">SAFE ZONE</p>
                                    <h3 className="text-3xl font-bold text-emerald-600 mt-1">
                                        {subjects.filter(s => s.status === 'SAFE' || s.status === 'NO_DATA').length}
                                    </h3>
                                </div>
                                <ShieldCheck className="text-emerald-500" size={20} />
                            </div>
                            <div className="text-[10px] px-2 py-0.5 rounded-full w-fit mt-auto font-bold bg-emerald-50 text-emerald-700">
                                ON TRACK
                            </div>
                        </TechCard>

                        {/* 3. AT RISK */}
                        <TechCard className="p-4 flex flex-col justify-between h-28">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">ATTENTION</p>
                                    <h3 className={`text-3xl font-bold mt-1 ${subjects.filter(s => s.status === 'DANGER' || s.status === 'WARNING').length > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                                        {subjects.filter(s => s.status === 'DANGER' || s.status === 'WARNING').length}
                                    </h3>
                                </div>
                                <AlertTriangle className={subjects.filter(s => s.status === 'DANGER' || s.status === 'WARNING').length > 0 ? 'text-red-500' : 'text-gray-300'} size={20} />
                            </div>
                            <div className={`text-[10px] px-2 py-0.5 rounded-full w-fit mt-auto font-bold ${subjects.filter(s => s.status === 'DANGER' || s.status === 'WARNING').length > 0 ? 'bg-red-50 text-red-700 animate-pulse' : 'bg-gray-50 text-gray-400'}`}>
                                {subjects.filter(s => s.status === 'DANGER' || s.status === 'WARNING').length > 0 ? 'ACTION REQUIRED' : 'ALL GOOD'}
                            </div>
                        </TechCard>

                        {/* 4. TODAY'S STACK (BACKEND DRIVEN) */}
                        <TechCard className="p-0 flex flex-col h-32 bg-gray-50 border-gray-200">
                            <div className="overflow-y-auto scrollbar-hide flex-1 p-2 space-y-1">
                                {timetable.length > 0 ? timetable
                                    .filter(t => new Date(t.date).toLocaleDateString() === new Date().toLocaleDateString())
                                    .slice(0, 3).map((t, i) => (
                                        <div key={i} className="flex gap-2 items-center text-xs p-1.5 bg-white border border-gray-100 rounded">
                                            <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'UPCOMING' ? 'bg-blue-500' : 'bg-gray-400'
                                                }`}></div>
                                            <span className="font-mono text-gray-500">{t.time ? t.time.split(' ')[0] : 'TBA'}</span>
                                            <span className="font-bold text-gray-800 truncate">{t.code}</span>
                                        </div>
                                    )) : <div className="text-center text-xs text-gray-400 mt-4">No classes scheduled 🎉</div>}
                            </div>
                        </TechCard>
                    </div>

                    {/* RECOVERY PLAN (If Needed) */}
                    {weightedAvg < 80 && (
                        <div className="bg-gray-900 rounded-xl p-6 text-white flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-gray-200">
                            <div className="flex-1 w-full">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                                    <span>Optimization Goal</span>
                                    <span>Target: 80%</span>
                                </div>
                                {/* Tech Progress Bar */}
                                <div className="h-4 bg-gray-800 rounded-none relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik00IDBMIHCANCiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-20"></div>
                                    <div className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-1000" style={{ width: '65%' }}></div>
                                </div>
                            </div>
                            <div className="w-full md:w-auto text-sm font-mono border-l border-gray-700 pl-6">
                                <div className="text-red-400 font-bold mb-1">⚠ DEVIATION DETECTED</div>
                                <div className="text-gray-400">Attend next <span className="text-white font-bold">4 sessions</span> to recalibrate.</div>
                            </div>
                        </div>
                    )}

                    {/* SUBJECT ATTENDANCE OVERVIEW (Grid Layout) */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                            <BookOpen size={18} className="text-gray-400" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">Subject Attendance Overview</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subjects && subjects.length > 0 ? (
                                subjects.map((subject, index) => {
                                    // Strict Backend Status Logic
                                    const indicators = subject.academic_indicators || {};
                                    const policy = indicators.policy || {};
                                    const details = indicators.danger_details || {};

                                    const conduct = subject.sessions_conducted || 0;
                                    const attend = subject.attended_classes || 0;
                                    const displayPct = subject.attendance_percentage || 0;

                                    // Status Determination
                                    let statusColor = 'bg-green-100 text-green-700 border-green-200';
                                    let statusText = 'SAFE';

                                    if (conduct === 0) {
                                        statusText = 'SAFE'; // Always safe if no classes
                                    } else if (indicators.danger_zone) {
                                        statusColor = 'bg-red-100 text-red-700 border-red-200';
                                        statusText = 'DANGER';
                                    } else if (indicators.confidence_index === 'MODERATE') {
                                        statusColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
                                        statusText = 'MODERATE';
                                    }

                                    if (!expandSubjects && index >= 4) return null;

                                    return (
                                        <motion.div
                                            key={subject.subject_id || index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                                        >
                                            <div className={`absolute top-0 right-0 px-2 py-1 text-[10px] font-bold uppercase border-l border-b rounded-bl-lg ${statusColor}`}>
                                                {statusText}
                                            </div>

                                            <h4 className="font-bold text-gray-900 text-sm truncate pr-16" title={subject.subject_name}>
                                                {subject.subject_name}
                                            </h4>

                                            <div className="flex items-center gap-2 mt-1 mb-2">
                                                <div className="text-[10px] text-gray-400 font-mono">{subject.subject_code}</div>
                                                {conduct === 0 ? (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-gray-50 text-gray-500 border-gray-100">
                                                        NO CLASSES CONDUCTED
                                                    </span>
                                                ) : (
                                                    indicators.confidence_index && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${indicators.confidence_index === 'HIGH_CONFIDENCE' ? 'bg-green-50 text-green-700 border-green-100' :
                                                            indicators.confidence_index === 'MODERATE' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                                'bg-red-50 text-red-700 border-red-100'
                                                            }`}>
                                                            {indicators.confidence_index.replace('_', ' ')}
                                                        </span>
                                                    )
                                                )}
                                            </div>

                                            <div className="flex items-end gap-2 mb-3">
                                                <div className={`text-3xl font-bold font-mono ${statusText === 'DANGER' ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {displayPct}%
                                                </div>
                                                <div className="text-xs text-gray-400 mb-1.5 font-medium">Attendance</div>
                                            </div>

                                            <div className="w-full bg-gray-100 h-1.5 rounded-full mb-3 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${statusText === 'DANGER' ? 'bg-red-500' : 'bg-nmims-primary'}`}
                                                    style={{ width: `${displayPct}%` }}
                                                ></div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-gray-50 rounded-lg p-2 border border-gray-100 font-mono text-gray-600 mb-2">
                                                <div>
                                                    <span className="block text-gray-400 uppercase text-[9px]">Total</span>
                                                    <span className="font-bold">{conduct}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 uppercase text-[9px]">Attended</span>
                                                    <span className="font-bold text-green-600">{attend}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 uppercase text-[9px]">Missed</span>
                                                    <span className="font-bold text-red-500">{conduct - attend}</span>
                                                </div>
                                            </div>

                                            {/* Footer: Policy or Recovery Hint */}
                                            {statusText === 'DANGER' && details.classes_needed_to_recover ? (
                                                <div className="text-[10px] text-center text-red-600 bg-red-50 py-1 rounded border border-red-100 font-bold animate-pulse">
                                                    ⚠ Attend next {details.classes_needed_to_recover} classes
                                                </div>
                                            ) : (
                                                <div className="text-[9px] text-center text-gray-400 bg-gray-50 py-1 rounded border border-transparent hover:border-gray-200 transition-colors">
                                                    Mandatory: {policy.mandatory_pct || 75}%
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="col-span-2 p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-6 h-6 text-nmims-primary animate-spin mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 font-mono">Loading Academic Records...</p>
                                        </>
                                    ) : (
                                        <>
                                            <BookOpen className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 font-mono">No subjects enrolled yet.</p>
                                            <p className="text-xs text-gray-400 mt-1">Contact admin or set your course/semester.</p>
                                        </>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Expand Button */}
                        {subjects.length > 4 && (
                            <button
                                onClick={() => setExpandSubjects(!expandSubjects)}
                                className="w-full mt-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-cyan-600 hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded transition-all flex items-center justify-center gap-2"
                            >
                                {expandSubjects ? 'Collapse Overview' : `View All ${subjects.length} Subjects`}
                                <ArrowRight size={14} className={`transition-transform ${expandSubjects ? '-rotate-90' : 'rotate-90'}`} />
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT COL (Notifications & Insights) */}
                <div className="space-y-6">
                    {/* Heatmap */}
                    <TechCard className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity size={16} className="text-gray-400" />
                            <h4 className="text-xs font-bold uppercase text-gray-500">Weekly Activity</h4>
                        </div>
                        <div className="opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="flex justify-between items-end h-24 gap-1">
                                {[40, 60, 30, 80, 50, 20, 0].map((h, i) => (
                                    <div key={i} className="w-full bg-gray-100 rounded-t-sm relative group">
                                        <div
                                            className="absolute bottom-0 w-full bg-cyan-500/80 rounded-t-sm transition-all group-hover:bg-cyan-400"
                                            style={{ height: `${h}%` }}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] font-mono text-gray-400 uppercase">
                                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                            </div>
                        </div>
                    </TechCard>



                    {/* AI Insight (Backend Driven) */}
                    {(data.analytics?.insight_events && data.analytics.insight_events.length > 0) && (
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={80} /></div>
                            <h4 className="text-xs font-bold uppercase text-cyan-800 mb-2 flex items-center gap-2">
                                <Zap size={12} fill="currentColor" /> System Insight
                            </h4>
                            <p className="text-sm text-cyan-900 leading-snug font-medium mb-3">
                                {data.analytics.insight_events[0].message}
                            </p>
                            <div className="flex gap-2">
                                <div className="bg-white/50 px-2 py-1 rounded text-[10px] font-mono text-cyan-800 border border-cyan-200">
                                    IMPACT: DETECTED
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(`/student/${data.currentUser?.id}/course-info`)} className="bg-white border border-gray-200 py-3 rounded-lg text-xs font-bold text-gray-600 hover:border-gray-400 hover:shadow-md transition-all flex flex-col items-center gap-1">
                            <BookOpen size={18} className="text-gray-400" /> Syllabus
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(`/student/${data.currentUser?.id}/analytics`)} className="bg-gray-800 border border-gray-900 py-3 rounded-lg text-xs font-bold text-white hover:bg-gray-700 hover:shadow-md transition-all flex flex-col items-center gap-1">
                            <BarChart2 size={18} className="text-cyan-400" /> Analytics
                        </motion.button>
                    </div>
                </div>
            </div>

        </motion.div >
    );
};

export default StudentDashboard;
