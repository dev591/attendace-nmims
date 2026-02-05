
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, FileText, School, ExternalLink } from 'lucide-react';

const DirectorVerify = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/director/achievements/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setRequests(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleVerify = async (id, decision) => {
        if (!confirm(`Are you sure you want to ${decision} this request?`)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/director/achievement/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id, decision })
            });

            if (res.ok) {
                setRequests(prev => prev.filter(r => r.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] p-8 pb-32 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10 flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Verification Queue</h1>
                    <p className="text-slate-500 text-lg">Review and verify student achievement claims.</p>
                </header>

                {loading ? (
                    <div className="text-center text-slate-400 py-20 font-medium">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-24 px-6 rounded-2xl border border-dashed border-slate-300 bg-white">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">All Caught Up</h3>
                        <p className="text-slate-500">There are no pending achievements to verify at this time.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map(req => (
                            <motion.div
                                key={req.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center hover:border-slate-300 transition-colors"
                            >


                                {/* Left: Student Avatar & Name */}
                                <Link to={`/director/student/${req.sapid}`} className="flex items-center gap-4 min-w-[240px] group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                                        <img
                                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${req.student_name}`}
                                            alt={req.student_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{req.student_name}</h4>
                                        <p className="text-sm text-slate-500 font-mono mt-0.5">{req.sapid}</p>
                                    </div>
                                </Link>

                                {/* Middle: Content */}
                                <div className="flex-1 w-full border-t lg:border-t-0 border-slate-100 lg:border-l lg:pl-6 pt-4 lg:pt-0">
                                    <div className="flex gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider rounded">
                                            {req.type}
                                        </span>
                                        <span className="text-xs text-slate-400 py-0.5">{new Date(req.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-semibold text-lg text-slate-900 mb-1">{req.title}</h3>
                                    <p className="text-sm text-slate-500 mb-3 block">Issued by <span className="font-medium text-slate-700">{req.provider}</span></p>

                                    <a href={req.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
                                        <FileText size={16} /> View Proof Document <ExternalLink size={12} />
                                    </a>
                                </div>

                                {/* Right: Controls */}
                                <div className="flex gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                                    <button
                                        onClick={() => handleVerify(req.id, 'Rejected')}
                                        className="flex-1 lg:flex-none px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleVerify(req.id, 'Approved')}
                                        className="flex-1 lg:flex-none px-6 py-2.5 rounded-lg bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} /> Approve
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DirectorVerify;
