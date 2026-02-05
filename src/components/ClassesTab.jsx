
import React, { useEffect, useState } from 'react';
import { Clock, Calendar, MapPin, Beaker, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ClassesTab = ({ sessions }) => {
    // No more fetching! Data is passed down.

    // Group by Date for UI
    const groupedData = React.useMemo(() => {
        if (!sessions || sessions.length === 0) return [];

        const grouped = {};
        sessions.forEach(session => {
            // Ensure date is formatted nicely
            const d = new Date(session.date).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });

            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(session);
        });

        return Object.keys(grouped).map(date => ({
            date,
            label: date,
            sessions: grouped[date]
        }));
    }, [sessions]);

    if (!sessions || sessions.length === 0) return (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No Classes Scheduled</h3>
            <p className="text-slate-400 mt-2">Time to relax!</p>
        </div>
    );

    return (
        <div className="w-full space-y-12 pb-20">

            {/* Header */}
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Your Timetable</h2>
                <p className="text-slate-500 mt-2"> synced from official records</p>
            </div>

            {/* TIMETABLE GROUPS */}
            {groupedData.map((group, groupIdx) => (
                <motion.div
                    key={group.date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIdx * 0.1 }}
                >
                    {/* Date Header using Sticky positioning for better UX */}
                    <div className="sticky top-0 z-10 bg-[#FDFDFD]/95 backdrop-blur-sm py-4 mb-4 flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-200"></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                            {group.label}
                        </h3>
                        <div className="h-px flex-1 bg-slate-200"></div>
                    </div>

                    <div className="space-y-4">
                        {group.sessions.map((session) => {
                            const isLab = session.type && session.type.toUpperCase().includes('LAB');
                            const isOngoing = session.time_status === 'ONGOING' || session.status === 'ongoing';
                            const isPast = session.time_status === 'CONDUCTED' || session.status === 'conducted' || new Date(session.date) < new Date().setHours(0, 0, 0, 0);

                            // Visual States
                            let cardBg = "bg-white";
                            let borderColor = "border-slate-100";
                            let textColor = "text-slate-900";
                            let iconColor = "text-slate-400";

                            if (isOngoing) {
                                cardBg = "bg-blue-600 shadow-xl shadow-blue-200 scale-[1.02]";
                                borderColor = "border-blue-500";
                                textColor = "text-white";
                                iconColor = "text-blue-200";
                            } else if (isPast) {
                                cardBg = "bg-slate-50 opacity-60 grayscale";
                                borderColor = "border-slate-100";
                                textColor = "text-slate-500";
                            }

                            return (
                                <div
                                    key={session.session_id}
                                    className={`
                                        relative overflow-hidden rounded-2xl border transition-all duration-300
                                        ${cardBg} ${borderColor}
                                        ${isLab ? 'min-h-[140px] md:min-h-[120px]' : 'min-h-[100px]'}
                                        ${isOngoing ? 'ring-4 ring-blue-500/20' : 'hover:shadow-md'}
                                    `}
                                >
                                    {/* ONGOING PULSE */}
                                    {isOngoing && (
                                        <div className="absolute top-3 right-3 flex items-center gap-2 bg-blue-500 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm border border-blue-400">
                                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                            LIVE NOW
                                        </div>
                                    )}

                                    <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">

                                        {/* 1. Time Column */}
                                        <div className={`min-w-[100px] text-center md:text-left ${isOngoing ? 'text-blue-100' : ''}`}>
                                            <div className="text-2xl font-bold tracking-tight">
                                                {session.start_time?.slice(0, 5) || session.start_time}
                                            </div>
                                            <div className={`text-sm font-medium opacity-60`}>
                                                to {session.end_time?.slice(0, 5) || session.end_time}
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className={`hidden md:block w-px h-12 ${isOngoing ? 'bg-blue-500' : 'bg-slate-100'}`}></div>

                                        {/* 2. Main Info */}
                                        <div className="flex-1">
                                            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 ${iconColor}`}>
                                                {isLab ? <Beaker size={14} /> : <BookOpen size={14} />}
                                                {session.type || 'Lecture'}
                                                <span className="mx-1">•</span>
                                                {session.subject_code}
                                            </div>

                                            <h4 className={`text-xl font-bold leading-tight ${textColor}`}>
                                                {session.subject_name || 'Subject'}
                                            </h4>

                                            <div className={`flex items-center gap-2 mt-2 text-sm font-medium ${isOngoing ? 'text-blue-100' : 'text-slate-500'}`}>
                                                <MapPin size={14} />
                                                Room {session.room || 'TBA'}
                                            </div>
                                        </div>

                                        {/* 3. Status/Action (Right Side) */}
                                        <div className="w-full md:w-auto flex items-center justify-end">
                                            {isPast && (
                                                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase">
                                                    <CheckCircle size={14} /> Completed
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Decorative Bar for Labs */}
                                    {isLab && !isOngoing && !isPast && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            ))}

            <div className="text-center pt-10 text-slate-400 text-xs">
                End of schedule
            </div>
        </div>
    );
};

export default ClassesTab;
