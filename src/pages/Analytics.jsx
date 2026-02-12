
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import {
    Calculator, TrendingUp, TrendingDown, Minus,
    ShieldCheck, Info, ChevronDown, ChevronUp, BarChart2, Users, AlertTriangle, Zap, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import AppealModal from '../components/AppealModal';
import config from '../utils/config';

const API_BASE = config.API_URL;

const Analytics = () => {
    const { data, user } = useStore();
    const [deepData, setDeepData] = useState(null);
    const [loadingDeep, setLoadingDeep] = useState(true);

    // --- STATE FOR SIMULATOR ---
    const [simMode, setSimMode] = useState(false);
    const [simValues, setSimValues] = useState({});
    const [showAllSubjects, setShowAllSubjects] = useState(false);

    // Fetch Deep Analytics on Mount
    useEffect(() => {
        const fetchDeep = async () => {
            if (!user?.sapid) return;
            try {
                const res = await fetch(`${API_BASE}/student/${user.sapid}/analytics/deep`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    setDeepData(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch deep analytics", err);
            } finally {
                setLoadingDeep(false);
            }
        };
        fetchDeep();
    }, [user]);


    const stats = data?.analytics?.risk_summary;
    const subjects = data?.subjects || [];

    if (!stats) return <div className="p-8 text-center text-slate-400">Loading Intelligence...</div>;

    // --- SIMULATOR LOGIC (Kept from before) ---
    const getSimulatedStatus = (sub) => {
        const input = simValues[sub.subject_id] || { attend: 0, miss: 0 };
        const baseConducted = Number(sub.units_conducted) || Number(sub.classes_conducted) || 0;
        const baseAttended = Number(sub.units_attended) || Number(sub.classes_attended) || 0;
        const newConducted = baseConducted + input.attend + input.miss;
        const newAttended = baseAttended + input.attend;
        const newPct = newConducted > 0 ? (newAttended / newConducted) * 100 : 0;
        const target = sub.mandatory_pct || 75;

        // Logic for recovery
        let needed = 0;
        if (newPct < target) {
            const currentC = newConducted;
            const currentA = newAttended;
            const T = target / 100;
            const num = (T * currentC) - currentA;
            const den = 1 - T;
            if (den > 0) needed = Math.ceil(num / den);
        }

        return {
            pct: newPct.toFixed(1),
            isSafe: newPct >= target,
            diff: (newPct - (Number(sub.attendance_percentage) || 0)).toFixed(1),
            needed: needed,
            target: target
        };
    };

    const updateSim = (id, type, val) => {
        setSimValues(prev => ({
            ...prev,
            [id]: { ...prev[id], [type]: Math.max(0, (prev[id]?.[type] || 0) + val) }
        }));
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] p-4 md:p-6 lg:p-8 font-sans text-slate-800 pb-24">
            <div className="max-w-full mx-auto space-y-8">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row items-end justify-between gap-8 border-b border-slate-100 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics Suite</h1>
                        <p className="text-slate-500 mt-2 font-medium">Deep Dive into your academic performance.</p>
                    </div>
                </div>

                {/* DEEP ANALYTICS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                    {/* 1. GAMIFICATION RANK (Moved from Dashboard) */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 relative overflow-hidden text-white group">
                        <div className="absolute top-0 right-0 p-24 bg-amber-500/10 rounded-full -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-colors"></div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Award size={16} className="text-amber-400" /> Global Rank
                            </h3>
                            <div className="mt-4">
                                <div className="text-3xl font-bold text-white group-hover:scale-110 transition-transform origin-left">
                                    #{data?.analytics?.risk_summary?.rank || '-'}
                                </div>
                                <div className="text-sm text-slate-400 mt-2">
                                    Based on XP & Attendance
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. PEER RANK CARD */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-24 bg-blue-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors"></div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Users size={16} /> Peer Rank
                            </h3>
                            <div className="mt-4">
                                {loadingDeep ? (
                                    <div className="h-8 bg-slate-100 animate-pulse w-24 rounded"></div>
                                ) : (
                                    <>
                                        <div className="text-3xl font-bold text-slate-900">
                                            Top {100 - (deepData?.peerRank?.percentile || 50)}%
                                        </div>
                                        <div className="text-sm text-slate-500 mt-2">
                                            {deepData?.peerRank?.message || "Analyzing cohort data..."}
                                        </div>
                                        {/* Visual Bar */}
                                        <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${deepData?.peerRank?.percentile || 0}%` }}
                                            ></div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. SAFE BUNK SUMMARY */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-24 bg-emerald-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Zap size={16} /> Safe Bunks
                            </h3>
                            <div className="mt-4">
                                {loadingDeep ? (
                                    <div className="h-8 bg-slate-100 animate-pulse w-24 rounded"></div>
                                ) : (
                                    <>
                                        <div className="text-3xl font-bold text-slate-900">
                                            {deepData?.safeBunks?.reduce((acc, s) => acc + s.can_miss, 0) || 0} <span className="text-lg font-medium text-slate-400">Total</span>
                                        </div>
                                        <div className="text-sm text-slate-500 mt-2">
                                            across {deepData?.safeBunks?.length || 0} subjects
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {deepData?.safeBunks?.slice(0, 3).map((s, i) => (
                                                <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-100">
                                                    {s.code}: {s.can_miss}
                                                </span>
                                            ))}
                                            {(deepData?.safeBunks?.length || 0) > 3 && (
                                                <span className="px-2 py-1 bg-slate-50 text-slate-500 text-xs font-bold rounded border border-slate-100">
                                                    +{deepData.safeBunks.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. MONTHLY TREND CHART */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={16} /> Monthly Trend
                        </h3>
                        <div className="flex-1 w-full min-h-[120px] mt-2">
                            {deepData?.monthlyTrends && deepData.monthlyTrends.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={deepData.monthlyTrends}>
                                        <defs>
                                            <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="pct"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorPct)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                                    Not enough data for trends
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SIMULATOR SECTION */}
                <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-white relative h-fit">
                    <div className="absolute top-0 right-0 p-32 bg-blue-500 blur-[100px] opacity-20"></div>

                    <div className="p-6 md:p-8 relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Calculator size={20} className="text-blue-400" /> Future Simulator
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">Project your attendance outcomes.</p>
                            </div>
                            <button
                                onClick={() => { setSimMode(!simMode); setSimValues({}); }}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-slate-700"
                            >
                                {simMode ? 'Reset Simulation' : 'Start Simulation'}
                            </button>
                        </div>

                        <AnimatePresence>
                            {/* ... Simulator UI (Keeping existing logic but simplifying JSX for brevity if needed) ... */}
                            {/* Re-using previous simulator JSX logic fully */}
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                                animate={{ opacity: 1 }}
                            >
                                {subjects.map(sub => {
                                    const sim = getSimulatedStatus(sub);
                                    const input = simValues[sub.subject_id] || { attend: 0, miss: 0 };
                                    const total = Number(sub.total_classes) || 45;
                                    const conducted = Number(sub.units_conducted) || Number(sub.classes_conducted) || 0;
                                    const remaining = Math.max(0, total - conducted);

                                    if (!simMode && input.attend === 0 && input.miss === 0) return null; // Collapse if not mode

                                    return (simMode || (input.attend > 0 || input.miss > 0)) && (
                                        <div key={sub.subject_id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col gap-3">
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <div>
                                                    <span className="truncate block w-24">{sub.subject_code}</span>
                                                    <span className="text-[10px] text-slate-500 font-normal">
                                                        {remaining - (input.attend + input.miss)} left
                                                    </span>
                                                </div>
                                                <span className={`${sim.isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {sim.pct}%
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1.5">
                                                <button onClick={() => updateSim(sub.subject_id, 'attend', -1)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-500 hover:text-white">-</button>
                                                <div className="flex-1 text-center text-xs">
                                                    <span className="text-emerald-500 block">Attend</span>
                                                    <span>{input.attend}</span>
                                                </div>
                                                <button onClick={() => updateSim(sub.subject_id, 'attend', 1)} className="w-6 h-6 flex items-center justify-center rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white">+</button>

                                                <div className="w-px h-6 bg-slate-800"></div>

                                                <button onClick={() => updateSim(sub.subject_id, 'miss', -1)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-500 hover:text-white">-</button>
                                                <div className="flex-1 text-center text-xs">
                                                    <span className="text-red-500 block">Miss</span>
                                                    <span>{input.miss}</span>
                                                </div>
                                                <button onClick={() => updateSim(sub.subject_id, 'miss', 1)} className="w-6 h-6 flex items-center justify-center rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white">+</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                            {!simMode && (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    Click "Start Simulation" to activate prediction controls.
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* MATRIX TABLE (Original Table) */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <h3 className="font-bold text-slate-800">Subject Health Matrix</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4 pl-6">Subject</th>
                                    <th className="p-4">Trend</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right pr-6">Att. %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {subjects.slice(0, showAllSubjects ? subjects.length : 5).map((sub, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 pl-6 font-bold text-slate-700">
                                            {sub.subject}
                                            <div className="text-xs text-slate-400 font-normal">{sub.code}</div>
                                        </td>
                                        <td className="p-4">
                                            {sub.trend === 'Declining' && <span className="text-red-500 text-xs font-bold flex items-center gap-1"><TrendingDown size={14} /> Down</span>}
                                            {sub.trend === 'Stable' && <span className="text-slate-400 text-xs font-bold">-</span>}
                                            {sub.trend === 'Rising' && <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><TrendingUp size={14} /> Up</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${sub.status === 'SAFE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className={`p-4 pr-6 text-right font-bold ${parseFloat(sub.percentage) >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {sub.percentage}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {subjects.length > 5 && (
                            <div className="p-4 text-center border-t border-slate-50">
                                <button
                                    onClick={() => setShowAllSubjects(!showAllSubjects)}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider transition-colors"
                                >
                                    {showAllSubjects ? 'Show Less' : `View All (${subjects.length})`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div >
        </div >
    );
};

export default Analytics;
