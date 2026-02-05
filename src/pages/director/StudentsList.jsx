import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/Store';
import { Search, Filter, X, Phone, Mail, FileText, Award, ExternalLink, MessageCircle, User, Bell, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:4000';

export default function StudentsList() {
    const { user } = useStore();
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [dept, setDept] = useState('All');
    const [year, setYear] = useState('All');
    const [selectedSapid, setSelectedSapid] = useState(null);

    // Fetch List
    useEffect(() => {
        const fetchStudents = async () => {
            if (!user?.token) return;
            try {
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (dept !== 'All') params.append('dept', dept);
                if (year !== 'All') params.append('year', year);

                const res = await fetch(`${API_BASE}/director/students?${params}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) setStudents(await res.json());
            } catch (err) { console.error(err); }
        };
        const timeout = setTimeout(fetchStudents, 300);
        return () => clearTimeout(timeout);
    }, [user, search, dept, year]);

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Directory</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and monitor student performace</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Dept Filter */}
                    <div className="relative">
                        <select
                            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                            value={dept}
                            onChange={(e) => setDept(e.target.value)}
                        >
                            <option value="All">All Schools</option>
                            <option value="STME">STME (Eng & Data Science)</option>
                            <option value="SPTM">SPTM (Pharma)</option>
                            <option value="SBM">SBM (MBA)</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {/* Year Filter */}
                    <div className="relative">
                        <select
                            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            <option value="All">All Years</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Name or SAP ID..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none w-64 text-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider text-xs">
                        <tr>
                            <th className="px-6 py-4">Student Identity</th>
                            <th className="px-6 py-4">School / Dept</th>
                            <th className="px-6 py-4 text-center">Batch</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {students.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-400">No students found matching filters.</td></tr>
                        ) : (
                            students.map(s => (
                                <tr key={s.sapid} className="hover:bg-red-50/10 transition-colors group cursor-pointer" onClick={() => setSelectedSapid(s.sapid)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                                                {s.name?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-red-700 transition-colors">{s.name}</div>
                                                <div className="text-xs text-gray-400 font-mono tracking-wide">{s.sapid}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800">
                                            {s.dept || 'General'}
                                        </span>
                                        <div className="text-xs text-gray-400 mt-1">{s.program}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-mono text-gray-600">Year {s.year}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-wider border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-all shadow-sm">
                                            View Profile
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Profile Modal */}
            <AnimatePresence>
                {selectedSapid && <StudentProfileModal sapid={selectedSapid} onClose={() => setSelectedSapid(null)} />}
            </AnimatePresence>
        </div>
    );
}

// Sub-Component: Profile Modal
function StudentProfileModal({ sapid, onClose }) {
    const { user } = useStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, marks, projects
    const [showNotify, setShowNotify] = useState(false);
    const [noteMsg, setNoteMsg] = useState('');
    const [sendingNote, setSendingNote] = useState(false);

    const sendNotification = async () => {
        if (!noteMsg.trim()) return;
        setSendingNote(true);
        try {
            const res = await fetch(`${API_BASE}/director/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ sapid, message: noteMsg, type: 'info' })
            });
            if (res.ok) {
                setNoteMsg('');
                setShowNotify(false);
                // Optional: Show toast
            }
        } catch (e) { console.error(e); } finally { setSendingNote(false); }
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(`${API_BASE}/director/student/${sapid}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) setData(await res.json());
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchDetails();
    }, [sapid, user]);

    if (!sapid) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10">
                    <X size={20} className="text-gray-600" />
                </button>

                {loading ? (
                    <div className="p-20 flex justify-center"><div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                    <>
                        {/* Profile Header */}
                        <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 p-8 text-white relative flex-shrink-0">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                <div className="h-24 w-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-bold shadow-xl">
                                    {data?.profile.name?.[0]}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-3xl font-bold">{data?.profile.name}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-gray-300 text-sm">
                                        <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10 font-mono tracking-wide">{data?.profile.sapid}</span>
                                        <span>•</span>
                                        <span>{data?.profile.program}</span>
                                        <span>•</span>
                                        <span>Year {data?.profile.year}</span>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex gap-3 mt-6 relative">
                                        <button
                                            onClick={() => setShowNotify(!showNotify)}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-900/20 transition-all hover:scale-105"
                                        >
                                            <Bell size={16} /> Notify Student
                                        </button>

                                        {/* Notification Popup */}
                                        {showNotify && (
                                            <div className="absolute top-12 left-0 bg-white text-gray-800 p-4 rounded-xl shadow-2xl w-80 z-50 border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                                    <Bell size={14} className="text-indigo-600" /> Send Announcement
                                                </h4>
                                                <textarea
                                                    className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50"
                                                    rows="3"
                                                    placeholder="Type message here..."
                                                    value={noteMsg}
                                                    onChange={e => setNoteMsg(e.target.value)}
                                                />
                                                <div className="flex justify-end gap-2 mt-3">
                                                    <button onClick={() => setShowNotify(false)} className="text-xs font-semibold text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
                                                    <button
                                                        onClick={sendNotification}
                                                        disabled={sendingNote || !noteMsg.trim()}
                                                        className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        {sendingNote ? 'Sending...' : <><Send size={12} /> Send</>}
                                                    </button>
                                                </div>
                                                {/* Arrow */}
                                                <div className="absolute -top-2 left-6 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200"></div>
                                            </div>
                                        )}

                                        {data?.profile.parent_phone && (
                                            <a
                                                href={`https://wa.me/${data.profile.parent_phone.replace(/\D/g, '')}`}
                                                target="_blank" rel="noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-sm font-bold shadow-lg shadow-green-900/20 transition-all hover:scale-105"
                                            >
                                                <MessageCircle size={16} /> WhatsApp Parent
                                            </a>
                                        )}
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm transition-colors">
                                            <Phone size={14} /> {data?.profile.phone || 'No Phone'}
                                        </div>
                                    </div>
                                </div>

                                {/* Analytics Mini-Badge */}
                                <div className="text-right hidden md:block">
                                    <div className="text-sm text-gray-400 mb-1">Overall Attendance</div>
                                    <div className={`text-5xl font-bold tracking-tighter ${data?.analytics.attendanceSummary.totalSessions > 0 ? (data?.analytics.attendanceRate < 75 ? 'text-red-400' : 'text-green-400') : 'text-gray-500'}`}>
                                        {data?.analytics.attendanceSummary.totalSessions > 0 ? `${data?.analytics.attendanceRate}%` : 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {data?.analytics.attendanceSummary.totalSessions > 0 ? `Based on ${data?.analytics.attendanceSummary.totalSessions} sessions` : 'No sessions recorded'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 px-8 flex-shrink-0">
                            {['overview', 'marks', 'projects'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-4 text-sm font-semibold capitalize relative transition-colors ${activeTab === tab ? 'text-red-600' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="p-8 bg-gray-50/50 flex-1 overflow-y-auto">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Subject Wise Attendance</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {data?.analytics.subjectMetrics.map((sub, i) => (
                                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-gray-900">{sub.subject_name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{sub.attended} / {sub.conducted} Sessions</div>
                                                </div>
                                                <div className={`text-xl font-bold ${sub.attendance_percentage < 75 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {sub.attendance_percentage}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'marks' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Award size={20} className="text-yellow-500" /> In-Course Assessments (ICA)
                                    </h3>

                                    {(!data?.ica_marks || data.ica_marks.length === 0) ? (
                                        <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                                            No marks data available for this student.
                                        </div>
                                    ) : (
                                        // Visualizing Marks
                                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="h-64 w-full mb-6">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={data.ica_marks}>
                                                        <XAxis dataKey="subject_code" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                                        <YAxis hide />
                                                        <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                                        <Bar dataKey="marks_obtained" name="Marks" radius={[4, 4, 0, 0]}>
                                                            {data.ica_marks.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.marks_obtained < (entry.total_marks * 0.4) ? '#ef4444' : '#4f46e5'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">Subject</th>
                                                        <th className="px-4 py-2 text-left">Test</th>
                                                        <th className="px-4 py-2 text-right">Score</th>
                                                        <th className="px-4 py-2 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {data.ica_marks.map((m, i) => (
                                                        <tr key={i}>
                                                            <td className="px-4 py-2 font-medium">{m.subject_code}</td>
                                                            <td className="px-4 py-2 text-gray-500">{m.test_name}</td>
                                                            <td className="px-4 py-2 text-right font-bold text-gray-900">{m.marks_obtained}</td>
                                                            <td className="px-4 py-2 text-right text-gray-400">{m.total_marks}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'projects' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <FileText size={20} className="text-blue-500" /> Project Portfolio
                                        </h3>
                                        <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                                            {data?.projects?.length || 0} Submissions
                                        </span>
                                    </div>

                                    {(!data?.projects || data.projects.length === 0) ? (
                                        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                                            <div className="mb-2">📭</div>
                                            Student has not uploaded any projects yet.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {data.projects.map((p, i) => (
                                                <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{p.title}</h4>
                                                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{p.description}</p>
                                                        </div>
                                                        <a
                                                            href={p.link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                                                        >
                                                            <ExternalLink size={20} />
                                                        </a>
                                                    </div>
                                                    <div className="mt-4 flex items-center gap-3 text-xs font-medium">
                                                        <span className={`px-2 py-1 rounded-md ${p.status === 'Verified' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                            p.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                                'bg-gray-50 text-gray-600'
                                                            }`}>
                                                            {p.status}
                                                        </span>
                                                        <span className="text-gray-400">Submitted on {new Date(p.submitted_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
