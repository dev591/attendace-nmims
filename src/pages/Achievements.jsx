
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/Store';
import { Upload, X, Check, Award, Clock, FileText } from 'lucide-react';

const Achievements = () => {
    const { user } = useStore();
    const [achievements, setAchievements] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchAchievements = async () => {
        try {
            const res = await fetch('http://localhost:5000/student/achievements', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) setAchievements(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchAchievements();
    }, [user]);

    const stats = {
        totalPoints: achievements.filter(a => a.status === 'Approved').reduce((sum, a) => sum + (a.points || 0), 0),
        verified: achievements.filter(a => a.status === 'Approved').length,
        pending: achievements.filter(a => a.status === 'Pending').length
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] p-4 md:p-8 pb-20">
            <div className="max-w-full mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Portfolio</h1>
                        <p className="text-slate-500">Showcase your skills & certifications</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <Upload size={18} /> Upload Certificate
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">Total Points</div>
                        <div className="text-4xl font-bold flex items-center gap-2">
                            {stats.totalPoints}
                            <span className="text-sm bg-white/20 px-2 py-1 rounded text-white/90 font-semibold">XP</span>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Verified Skills</div>
                        <div className="text-3xl font-bold text-slate-800">{stats.verified}</div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Pending Review</div>
                        <div className="text-3xl font-bold text-slate-800">{stats.pending}</div>
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {loading ? (
                        <div className="col-span-2 text-center py-12 text-slate-400">Loading portfolio...</div>
                    ) : achievements.length === 0 ? (
                        <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                            <Award className="mx-auto text-slate-300 mb-4" size={48} />
                            <h3 className="text-lg font-semibold text-slate-700">No achievements yet</h3>
                            <p className="text-slate-400 max-w-sm mx-auto mt-2">Upload your course certificates, internship letters, or hackathon wins to earn points.</p>
                        </div>
                    ) : (
                        achievements.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex justify-between items-start"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            item.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {item.status}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock size={12} /> {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg leading-snug">{item.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium">{item.provider} • {item.type}</p>
                                </div>

                                {item.status === 'Approved' && (
                                    <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg text-sm">
                                        +10 XP
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showModal && <UploadModal onClose={() => setShowModal(false)} onUpload={fetchAchievements} />}
            </AnimatePresence>
        </div>
    );
};

export const UploadModal = ({ onClose, onUpload }) => {
    const { user } = useStore();
    const [form, setForm] = useState({ title: '', provider: '', type: 'Course', date: '' });
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // ANTI-GRAVITY: Dynamic API URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert("Please select a file");

        setSubmitting(true);
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('provider', form.provider);
        formData.append('type', form.type);
        formData.append('date_completed', form.date);
        formData.append('certificate', file);

        try {
            const res = await fetch(`${API_URL}/student/achievement`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: formData
            });
            if (res.ok) {
                onUpload(); // Refresh parent
                onClose();
            } else {
                alert("Upload failed. Ensure file is PDF/Image.");
            }
        } catch (err) {
            console.error(err);
            alert("Network Error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-900">Add Certificate</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                        <input required type="text" placeholder="e.g. Advanced React Pattern" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Provider</label>
                            <input required type="text" placeholder="e.g. Coursera" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                onChange={e => setForm({ ...form, provider: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option>Course</option>
                                <option>Internship</option>
                                <option>Hackathon</option>
                                <option>Workshop</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Completion Date</label>
                        <input required type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>

                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                        <input required type="file" accept=".pdf,.jpg,.png" className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={e => setFile(e.target.files[0])} />
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                            <Upload className="text-indigo-500" size={24} />
                            {file ? (
                                <span className="text-sm font-bold text-slate-800">{file.name}</span>
                            ) : (
                                <span className="text-sm text-slate-500 font-medium">Click to upload Proof (PDF/IMG)</span>
                            )}
                        </div>
                    </div>

                    <button disabled={submitting} type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50">
                        {submitting ? 'Uploading...' : 'Submit for Verification'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Achievements;
