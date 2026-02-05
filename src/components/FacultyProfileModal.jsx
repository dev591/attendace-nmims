
import React, { useEffect, useState } from 'react';
import { X, Phone, Mail, MapPin, Clock, Calendar, ShieldCheck, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import config from '../utils/config';

const API_BASE = config.API_URL;

export default function FacultyProfileModal({ facultyId, onClose, token }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!facultyId || !token) return;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                // Use SAPID or ID
                const res = await fetch(`${API_BASE}/director/faculty/${facultyId}/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                } else {
                    console.error("Failed to fetch faculty profile");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [facultyId, token]);

    if (!facultyId) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header with Live Status */}
                    <div className="relative h-32 bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex items-end">
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                            <X size={20} />
                        </button>

                        <div className="flex items-end gap-4 translate-y-8 w-full">
                            <img
                                src={`https://api.dicebear.com/9.x/initials/svg?seed=${data?.profile?.name || 'F'}`}
                                className="h-24 w-24 rounded-2xl border-4 border-white shadow-lg bg-gray-100"
                                alt="Profile"
                            />
                            <div className="mb-2 text-white flex-1">
                                <h2 className="text-2xl font-bold">{loading ? "Loading..." : data?.profile?.name}</h2>
                                <p className="text-white/80 text-sm flex items-center gap-2">
                                    {data?.profile?.designation || 'Faculty'} • {data?.profile?.dept}
                                </p>
                            </div>

                            {/* Live Badge */}
                            {!loading && data?.liveStatus && (
                                <div className={`mb-3 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg border border-white/10 backdrop-blur-md ${data.liveStatus.state === 'BUSY'
                                    ? 'bg-rose-500 text-white animate-pulse'
                                    : 'bg-emerald-500 text-white'
                                    }`}>
                                    <Activity size={14} />
                                    {data.liveStatus.state === 'BUSY' ? 'BUSY NOW' : 'AVAILABLE'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="pt-12 px-8 pb-8 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-32 bg-gray-100 rounded-xl"></div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Live Context */}
                                {data.liveStatus?.state === 'BUSY' && (
                                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-4">
                                        <div className="h-10 w-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-rose-900">Currently Teaching</div>
                                            <div className="text-sm text-rose-700">{data.liveStatus.details}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Quick Stats Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Adherence Score</div>
                                        <div className="text-2xl font-bold text-slate-900">{data.stats?.adherence_pct}%</div>
                                        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                            <ShieldCheck size={12} /> Verified System Data
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Classes (30d)</div>
                                        <div className="text-2xl font-bold text-slate-900">{data.stats?.monthly_classes}</div>
                                    </div>
                                </div>

                                {/* Contact Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <a href={`mailto:${data.profile.email}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent hover:border-gray-200">
                                        <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Mail size={16} />
                                        </div>
                                        <div className="text-sm truncate">
                                            <div className="font-bold text-gray-900">Email</div>
                                            <div className="text-gray-500">{data.profile.email}</div>
                                        </div>
                                    </a>
                                    <a href={`tel:${data.profile.phone}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent hover:border-gray-200">
                                        <div className="h-8 w-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                                            <Phone size={16} />
                                        </div>
                                        <div className="text-sm">
                                            <div className="font-bold text-gray-900">Phone</div>
                                            <div className="text-gray-500">{data.profile.phone || 'N/A'}</div>
                                        </div>
                                    </a>
                                </div>

                                {/* Timeline */}
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Calendar size={18} className="text-gray-400" /> Today's Schedule
                                    </h3>
                                    <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                                        {data.todaySchedule && data.todaySchedule.length > 0 ? (
                                            data.todaySchedule.map((session, i) => (
                                                <div key={i} className="relative pl-6 pb-2 group">
                                                    <div className={`absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border-2 border-white ${session.status === 'conducted' ? 'bg-green-500' : 'bg-gray-300'
                                                        } ring-4 ring-white`}></div>

                                                    <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-bold text-gray-900">{session.subject_name}</div>
                                                                <div className="text-xs text-gray-500 font-mono">{session.subject_code} • {session.location}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">
                                                                    {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                                                                </div>
                                                                <div className={`text-[10px] font-bold mt-1 uppercase ${session.status === 'conducted' ? 'text-green-600' : 'text-gray-400'
                                                                    }`}>{session.status}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="pl-6 text-sm text-gray-500 italic">No classes scheduled for today.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
