
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useParams } from 'react-router-dom';

import config from '../utils/config';

const Timetable = () => {
    const { id } = useParams();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(new Date().toLocaleDateString('en-US', { weekday: 'Long' }));
    // Default to today (Monday, Tuesday...) - Note: Backend returns 'Monday', etc. or we group by date.
    // Backend ?view=week returns actual sessions with dates. 
    // We should group them by Day Name.

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchTimetable();
    }, [id]);

    const fetchTimetable = async () => {
        try {
            const res = await fetch(`${config.API_URL}/student/${id}/timetable?view=week`);
            const data = await res.json();
            if (data.sessions) {
                setSchedule(data.sessions);
            }
        } catch (e) {
            console.error("Failed to load timetable", e);
        } finally {
            setLoading(false);
        }
    };

    // Filter for Active Tab
    const getSessionsForDay = (day) => {
        return schedule.filter(s => {
            const date = new Date(s.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            return dayName === day;
        });
    };

    const currentSessions = getSessionsForDay(activeTab);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-24 font-sans">
            {/* Header */}
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Class Schedule
                    </h1>
                    <p className="text-slate-400 mt-1">Weekly Master Timetable & Live Updates</p>
                </div>
                <button
                    onClick={fetchTimetable}
                    className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-800 transition-all border border-slate-700/50"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin text-blue-400" : "text-slate-400"} />
                </button>
            </header>

            {/* Day Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
                {days.map(day => (
                    <button
                        key={day}
                        onClick={() => setActiveTab(day)}
                        className={`px-6 py-2 rounded-full whitespace-nowrap transition-all duration-300 font-medium ${activeTab === day
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                            : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800'
                            }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Schedule List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading schedule...</div>
                ) : currentSessions.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                            <Calendar className="text-slate-600" size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300">No classes scheduled</h3>
                        <p className="text-slate-500">Free day! Enjoy your time off.</p>
                    </div>
                ) : (
                    currentSessions.map((session, idx) => (
                        <SessionCard key={idx} session={session} />
                    ))
                )}
            </div>
        </div>
    );
};

const SessionCard = ({ session }) => {
    // Status Logic
    const getStatusColor = (status) => {
        if (status === 'ONGOING') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
        if (status === 'COMPLETED') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
        if (status === 'CANCELLED') return 'text-red-400 border-red-500/30 bg-red-500/10';
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10'; // UPCOMING
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 overflow-hidden hover:border-slate-700 transition-all"
        >
            {/* Left Indicator Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${session.live_status === 'ONGOING' ? 'bg-amber-500' :
                session.live_status === 'COMPLETED' ? 'bg-emerald-500' :
                    session.live_status === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-500'
                }`} />

            <div className="flex justify-between items-start pl-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-slate-400 bg-black/30 px-2 py-0.5 rounded border border-slate-800">
                            {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                        </span>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(session.live_status)}`}>
                            {session.live_status} {session.live_status === 'ONGOING' && <span className="animate-pulse">●</span>}
                        </span>
                    </div>

                    <h3 className="text-xl font-semibold text-white group-hover:text-blue-200 transition-colors">
                        {session.subject_name}
                    </h3>
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                        <span className="bg-slate-800 px-1.5 rounded text-xs">{session.subject_code}</span>
                        {session.type || 'Lecture'}
                    </p>
                </div>

                <div className="text-right space-y-2">
                    <div className="flex items-center justify-end gap-1.5 text-slate-300 text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                        <MapPin size={14} className="text-purple-400" />
                        {session.location || 'TBD'}
                    </div>
                    {session.faculty && (
                        <div className="flex items-center justify-end gap-1.5 text-slate-400 text-xs">
                            <User size={12} />
                            {session.faculty}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Timetable;
