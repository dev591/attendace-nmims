
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/Store';
import { motion } from 'framer-motion';
import { FileText, Check, X, Filter, Search, School } from 'lucide-react';
import config from '../../utils/config';



const AppealsDashboard = () => {
    // School Scope is Auto-Derived from Token
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [schoolName, setSchoolName] = useState('Loading...');
    const [filter, setFilter] = useState('All'); // Pending, Approved, Rejected

    const fetchAppeals = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${config.API_URL}/director/appeals`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.appeals) {
                setAppeals(data.appeals);
                setSchoolName(data.school);
            }
        } catch (e) {
            console.error("Failed to load appeals", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppeals();
    }, []);

    const handleAction = async (id, status) => {
        if (!confirm(`Are you sure you want to mark this appeal as ${status}?`)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${config.API_URL}/director/update-appeal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ appeal_id: id, status })
            });

            if (res.ok) {
                // Optimistic Update
                setAppeals(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            } else {
                alert("Action failed. Check console.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredAppeals = filter === 'All'
        ? appeals
        : appeals.filter(a => a.status === filter);

    const pendingCount = appeals.filter(a => a.status === 'Pending').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <School size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            {schoolName} Director Dashboard
                        </h1>
                        <p className="text-xs text-slate-500 font-mono">SECURE CONTEXT: {schoolName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                        {pendingCount} Pending Requests
                    </div>
                    {/* User Profile / Logout would go here */}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Stats / Config */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-slate-500 text-sm font-medium mb-1">Total Appeals</h3>
                        <p className="text-3xl font-bold">{appeals.length}</p>
                    </div>
                    {/* More stats could go here */}
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">Loading Appeals...</div>
                    ) : filteredAppeals.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                            <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                            <p className="text-slate-500">No appeals found in this category.</p>
                        </div>
                    ) : (
                        filteredAppeals.map(appeal => (
                            <motion.div
                                key={appeal.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row gap-6">


                                    {/* Student Info */}
                                    <div className="w-full md:w-1/4 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 pb-4 md:pb-0 md:pr-6">
                                        <Link to={`/director/student/${appeal.sapid}`} className="flex items-center gap-3 mb-2 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 -ml-2 rounded-lg transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold group-hover:scale-105 transition-transform">
                                                {appeal.student_name[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">{appeal.student_name}</h4>
                                                <p className="text-xs text-slate-500">{appeal.sapid}</p>
                                            </div>
                                        </Link>
                                        <div className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                                            <p>{appeal.program} • Year {appeal.year}</p>
                                            <p className="flex items-center gap-2">
                                                Attendance:
                                                <span className={`font-bold ${appeal.current_avg_attendance < 75 ? 'text-red-500' : 'text-green-500'
                                                    }`}>
                                                    {appeal.current_avg_attendance}%
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Appeal Content */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase rounded-md tracking-wide">
                                                {appeal.type}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(appeal.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg text-sm leading-relaxed">
                                            {appeal.description}
                                        </p>

                                        <div className="flex items-center gap-4">
                                            <a
                                                href={appeal.proof_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                                            >
                                                <FileText size={16} /> View Proof Document
                                            </a>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row md:flex-col gap-3 justify-center md:border-l border-slate-100 dark:border-slate-700 md:pl-6">
                                        {appeal.status === 'Pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleAction(appeal.id, 'Approved')}
                                                    className="flex-1 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(appeal.id, 'Rejected')}
                                                    className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                            </>
                                        ) : (
                                            <div className={`px-4 py-2 rounded-lg text-sm font-bold text-center border capitalize ${appeal.status === 'Approved'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {appeal.status}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppealsDashboard;
