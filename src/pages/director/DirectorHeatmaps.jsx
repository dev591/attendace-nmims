import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, AlertTriangle } from 'lucide-react';

export default function DirectorHeatmaps() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch real data
        const fetchData = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                const sessionStr = localStorage.getItem('attendance_session');
                const token = sessionStr ? JSON.parse(sessionStr).token : null;

                const res = await fetch(`${API_URL}/director/heatmaps`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setData(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    // Color scale
    const getColor = (pct) => {
        if (pct >= 85) return 'bg-emerald-500';
        if (pct >= 75) return 'bg-emerald-400';
        if (pct >= 65) return 'bg-amber-400';
        if (pct >= 50) return 'bg-orange-500';
        return 'bg-red-500';
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Loading Strategic Data...</div>;

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-indigo-600" />
                Institutional Health Heatmap
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-3 relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-3xl ${getColor(item.avg_attendance)}`}></div>

                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.dept}</div>
                                <div className="text-sm font-bold text-slate-700">Year {item.year}</div>
                            </div>
                            <div className={`${getColor(item.avg_attendance)} text-white text-xs font-bold px-2 py-1 rounded-lg`}>
                                {item.avg_attendance}%
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                            <div className="flex items-center gap-1">
                                <Users size={12} /> {item.student_count}
                            </div>
                            <div className="flex items-center gap-1 text-red-500 font-medium">
                                <AlertTriangle size={12} /> {item.risk_count} Risk
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-6 flex gap-4 text-xs font-bold text-slate-500 justify-end">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Excellent (&gt;85%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Good (75-85%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Warning (65-75%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical (&lt;50%)</span>
            </div>
        </div>
    );
}
