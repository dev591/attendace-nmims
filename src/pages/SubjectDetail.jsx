import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, Calendar, TrendingUp, AlertTriangle, CheckCircle, Tag } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
// import { calculateStats } from '../data/mockData'; // REMOVED BY ANTI-GRAVITY

const SubjectDetail = () => {
    const { subId } = useParams(); // Fixed: match App.jsx route param
    const navigate = useNavigate();
    const { user, data } = useStore();
    const [difficulty, setDifficulty] = useState('Medium');

    // Internal state for sessions fetched from API
    const [sessions, setSessions] = useState([]);

    const subject = data.subjects?.find(s => s.subject_id === subId);

    // ANTI-GRAVITY FIX: Use real session history from store
    React.useEffect(() => {
        if (!data?.session_history || !subId) return;

        // Filter global history for this subject
        // Ensure subject_id matches (handle mocked vs real ID formats if needed, but snapshots should suffice)
        const relevantSessions = data.session_history.filter(s => s.subject_id === subId);

        // Sort by date descending (newest first) for history table
        const sorted = [...relevantSessions].sort((a, b) => new Date(b.date) - new Date(a.date));

        setSessions(sorted);
    }, [subId, data?.session_history]);

    if (!subject) return <div className="p-8 text-center text-gray-500">Subject sync failed. Not found.</div>;

    const stats = subject.stats || { percent: 0, isDanger: false, remaining: 0 }; // Use backend pre-calc

    // Calc Trend from Real Session Data
    // Reverse sessions to get chronological order
    // trendData removed (Verified Backend-Only Mode)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 text-gray-400 hover:bg-transparent hover:text-nmims-primary">
                        <ArrowLeft size={24} />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{subject.name}</h2>
                        <p className="text-gray-500">{subject.code} • {subject.credits} Credits</p>
                    </div>
                </div>

                {/* Difficulty Tag Removed - Not supported by backend yet */}
                {/* <div className="flex items-center gap-2">...</div> */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Trend Graph Removed per Final Requirements (Backend-Only Analytics) */}

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">Session History</h3>
                            <span className="text-xs text-gray-400">Synced from Portal</span>
                        </div>

                        {sessions.length === 0 ? (
                            <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium">No sessions synced yet.</p>
                                <p className="text-xs text-gray-400 mt-1">Check back later for Oracle updates.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                        <tr>
                                            <th className="p-3 font-medium">Date</th>
                                            <th className="p-3 font-medium">Type</th>
                                            <th className="p-3 font-medium">Status</th>
                                            <th className="p-3 font-medium text-right">Attendance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sessions.map((session, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="p-3 text-gray-900">
                                                    {new Date(session.date).toLocaleDateString(undefined, {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                    <span className="text-gray-400 text-xs ml-1">{session.time}</span>
                                                </td>
                                                <td className="p-3 text-gray-500">{session.type}</td>
                                                <td className="p-3">
                                                    <span className="text-gray-500">{session.status}</span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {session.status === 'UPCOMING' ? (
                                                        <span className="text-blue-500 font-bold flex items-center justify-end gap-1">⏰ Upcoming</span>
                                                    ) : (
                                                        <span className="text-gray-500 font-bold flex items-center justify-end gap-1">
                                                            {session.attendance === 'PRESENT' ? (
                                                                <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Present</span>
                                                            ) : session.attendance === 'ABSENT' ? (
                                                                <span className="text-red-500 flex items-center gap-1"><AlertTriangle size={14} /> Absent</span>
                                                            ) : (
                                                                <span className="text-gray-400">Marking...</span>
                                                            )}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Card className={`text-center border-t-8 ${stats.isDanger ? 'border-t-status-danger' : 'border-t-status-good'}`}>
                        <div className="pt-4">
                            <div className="text-4xl font-bold text-gray-900">{stats.percent}%</div>
                            <div className="text-sm text-gray-500 uppercase tracking-widest mt-1">Current Status</div>

                            <div className="mt-6 flex flex-col gap-2">
                                <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Total Planned</span>
                                    <span className="font-bold">{subject.total_classes || subject.T || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Classes Held</span>
                                    <span className="font-bold">{subject.sessions_conducted || subject.conducted_classes || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Attended</span>
                                    <span className="font-bold text-nmims-primary">{subject.attended_classes || subject.A || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm pb-2">
                                    <span className="text-gray-500">Missed</span>
                                    <span className="font-bold text-red-500">{subject.missed_classes || subject.stats?.missed || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                                    <span className="text-gray-500 text-xs">Can Still Miss</span>
                                    <span className="font-bold text-green-600">{subject.can_still_miss || subject.stats?.canMiss || 0}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                {stats.isDanger ? (
                                    <p className="text-sm text-red-600 font-bold">Risk Zone: High</p>
                                ) : (
                                    <p className="text-sm text-green-600 font-bold">Risk Zone: Low</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={18} /> Class Calendar</h3>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="text-xs font-bold text-gray-400 py-1">{d}</span>)}
                            {(() => {
                                const today = new Date();
                                const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
                                const cells = [];

                                // Empty slots for previous month
                                for (let i = 0; i < firstDay; i++) {
                                    cells.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                                }

                                // Days
                                for (let d = 1; d <= daysInMonth; d++) {
                                    // Current cell date in local time
                                    const currentCellDate = new Date(today.getFullYear(), today.getMonth(), d);

                                    // Find session(s) for this day using Local Time Logic
                                    const session = sessions.find(s => {
                                        const sDate = new Date(s.date);
                                        return sDate.getDate() === d &&
                                            sDate.getMonth() === today.getMonth() &&
                                            sDate.getFullYear() === today.getFullYear();
                                    });

                                    let bgClass = "text-gray-400 hover:bg-gray-50";
                                    let content = d;

                                    if (session) {
                                        if (session.status === 'UPCOMING') {
                                            bgClass = "bg-blue-100 text-blue-700 font-bold shadow-sm ring-1 ring-blue-200";
                                        } else {
                                            // Conducted
                                            bgClass = "bg-gray-100 text-gray-700 font-bold ring-1 ring-gray-200";
                                        }
                                    }

                                    cells.push(
                                        <div key={d} className={`aspect-square flex items-center justify-center rounded text-xs transition-colors cursor-default ${bgClass}`} title={session ? `${session.status} (${session.time})` : 'No Class'}>
                                            {content}
                                        </div>
                                    );
                                }
                                return cells;
                            })()}
                        </div>
                        <div className="flex gap-2 justify-center mt-3 text-[10px] text-gray-500">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Present</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Absent</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Upcoming</span>
                        </div>
                    </Card>
                </div>
            </div >
        </div >
    );
};

export default SubjectDetail;
