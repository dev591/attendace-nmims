import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, AlertTriangle, CheckCircle, RefreshCcw, Calendar, TrendingUp } from 'lucide-react';

export default function BunkCalculator({ subjects = [], predictions = [] }) {
    // Merge subjects with predictions if available
    const mergedSubjects = useMemo(() => {
        return subjects.map(s => {
            const pred = predictions.find(p => p.code === s.subject_code) || {};
            return { ...s, ...pred };
        });
    }, [subjects, predictions]);

    const [selectedSubjectId, setSelectedSubjectId] = useState(mergedSubjects[0]?.subject_id || '');
    const [bunks, setBunks] = useState(1);

    const selectedSubject = useMemo(() =>
        mergedSubjects.find(s => s.subject_id === selectedSubjectId) || mergedSubjects[0] || null
        , [selectedSubjectId, mergedSubjects]);

    // Local "What-If" Calculation (Client-side simulation on top of server data)
    const simulation = useMemo(() => {
        if (!selectedSubject) return { pct: 0, status: 'UNKNOWN' };

        const currentPct = parseFloat(selectedSubject.attendanceRate || selectedSubject.percentage || 100);
        const totalClasses = parseInt(selectedSubject.units_total || 40); // Fallback
        const attended = parseInt(selectedSubject.units_attended || Math.round((currentPct / 100) * totalClasses));

        const newTotal = totalClasses + bunks; // Assuming misses add to total
        const newPct = (attended / newTotal) * 100;
        const isSafe = newPct >= 75;

        return {
            pct: newPct.toFixed(1),
            isSafe,
            drop: (currentPct - newPct).toFixed(1)
        };
    }, [selectedSubject, bunks]);

    if (!selectedSubject) return null;

    // AI Message Generation
    const getAiInsight = () => {
        if (!selectedSubject.status) return "Calculating risk profile...";

        if (selectedSubject.status === 'DANGER') {
            return (
                <span className="text-red-600 font-bold">
                    ⚠️ CRITICAL: You need to attend {selectedSubject.recovery_needed} classes to recover.
                </span>
            );
        }
        if (selectedSubject.status === 'BORDERLINE') {
            return (
                <span className="text-orange-600 font-bold">
                    🚧 BORDERLINE: You cannot afford to miss any classes.
                </span>
            );
        }
        if (selectedSubject.status === 'SAFE') {
            const msg = `You can safely bunk ${selectedSubject.safe_bunks} classes.`;
            if (selectedSubject.safe_until) {
                const date = new Date(selectedSubject.safe_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                    <span className="text-emerald-600 font-bold">
                        ✅ {msg} Free until {date}!
                    </span>
                );
            }
            return <span className="text-emerald-600 font-bold">✅ {msg}</span>;
        }
        return "Analyzing attendance patterns...";
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <TrendingUp size={22} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Predictive Intelligence</h3>
                    <p className="text-xs text-slate-500 font-medium">AI-Driven Attendance Risk Engine</p>
                </div>
            </div>

            <div className="flex-1 space-y-6">
                {/* 1. Subject Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Analysis</label>
                    <div className="relative">
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer hover:bg-slate-100"
                        >
                            {mergedSubjects.map(s => (
                                <option key={s.subject_id} value={s.subject_id}>
                                    {s.subject_name} ({s.percentage || s.attendanceRate}%)
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>

                {/* 2. AI Insight Box */}
                <div className={`p-4 rounded-xl border-l-4 shadow-sm transition-colors ${selectedSubject.status === 'DANGER' ? 'bg-red-50 border-red-500' :
                        selectedSubject.status === 'BORDERLINE' ? 'bg-orange-50 border-orange-500' :
                            'bg-emerald-50 border-emerald-500'
                    }`}>
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                            {selectedSubject.status === 'SAFE' ? <CheckCircle size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className={selectedSubject.status === 'DANGER' ? 'text-red-600' : 'text-orange-600'} />}
                        </div>
                        <div className="text-sm leading-relaxed">
                            {getAiInsight()}
                        </div>
                    </div>
                </div>

                {/* 3. Simulator (Slider) */}
                <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700 text-sm">Simulate Misses</span>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{bunks} Classes</span>
                    </div>

                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={bunks}
                        onChange={(e) => setBunks(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />

                    {/* Simulation Result */}
                    <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-500">Predicted Rate:</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 line-through">{selectedSubject.percentage || selectedSubject.attendanceRate}%</span>
                            <span className={`font-bold ${simulation.isSafe ? 'text-emerald-600' : 'text-red-600'}`}>
                                {simulation.pct}%
                            </span>
                            <span className="text-[10px] text-red-400 font-medium">(-{simulation.drop}%)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revert Button */}
            <button
                onClick={() => setBunks(1)}
                className="absolute top-6 right-6 text-slate-300 hover:text-indigo-500 transition-colors tooltip"
                title="Reset Simulator"
            >
                <RefreshCcw size={16} />
            </button>
        </div>
    );
}
