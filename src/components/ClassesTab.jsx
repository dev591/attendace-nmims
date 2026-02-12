
import React, { useEffect, useState } from 'react';
import { Clock, Calendar, MapPin, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import config from '../utils/config';

const ClassesTab = ({ studentId }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (studentId) {
            fetchTodaySchedule();
        } else {
            console.log("ClassesTab: Waiting for studentId...");
        }
    }, [studentId]);

    const fetchTodaySchedule = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${config.API_URL}/student/${studentId}/timetable?view=today`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.sessions) {
                setSessions(data.sessions);
            }
        } catch (e) {
            console.error("Failed to fetch today's schedule", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading schedule...</div>;

    if (sessions.length === 0) return (
        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                <Calendar size={20} className="text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No classes today</h3>
            <p className="text-xs text-slate-500 mt-1">Enjoy your free time!</p>
            <button
                onClick={() => navigate('timetable')}
                className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1"
            >
                View Full Timetable <ArrowRight size={12} />
            </button>
        </div>
    );

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline</span>
                <button
                    onClick={() => navigate('timetable')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                    Full Schedule <ArrowRight size={12} />
                </button>
            </div>

            {sessions.map((session, idx) => {
                const isOngoing = session.live_status === 'ONGOING';
                const isCompleted = session.live_status === 'COMPLETED';
                const isCancelled = session.live_status === 'CANCELLED';

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`
                            relative rounded-2xl border p-4 transition-all
                            ${isOngoing ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-200 text-white' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'}
                            ${isCompleted ? 'opacity-60 grayscale bg-slate-50' : ''}
                        `}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                {/* Time */}
                                <div className={`text-center min-w-[60px] ${isOngoing ? 'text-blue-100' : 'text-slate-600'}`}>
                                    <div className="text-lg font-bold leading-none">{session.start_time.slice(0, 5)}</div>
                                    <div className="text-[10px] opacity-70 mt-1">to {session.end_time.slice(0, 5)}</div>
                                </div>

                                {/* Divider */}
                                <div className={`w-px self-stretch ${isOngoing ? 'bg-blue-400' : 'bg-slate-100'}`}></div>

                                {/* Info */}
                                <div>
                                    <h4 className="font-bold text-lg leading-tight">{session.subject_name}</h4>
                                    <div className={`flex items-center gap-2 text-xs mt-1 ${isOngoing ? 'text-blue-100' : 'text-slate-500'}`}>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isOngoing ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                            {session.subject_code}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={10} /> {session.location || 'TBA'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Pill */}
                            <div>
                                {isOngoing && (
                                    <span className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full text-[10px] font-bold text-white border border-white/20 animate-pulse">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                                    </span>
                                )}
                                {isCompleted && (
                                    <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase">
                                        <CheckCircle size={12} /> Done
                                    </span>
                                )}
                                {isCancelled && (
                                    <span className="text-red-500 text-[10px] font-bold uppercase border border-red-200 bg-red-50 px-2 py-1 rounded">Cancelled</span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ClassesTab;
