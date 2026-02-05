import React, { useState } from 'react';
import { Calendar, Clock, MapPin, DollarSign, Send, AlertCircle } from 'lucide-react';
import { useStore } from '../../context/Store';
import { useNavigate } from 'react-router-dom';

const HostEvent = () => {
    const { user, api } = useStore();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '',
        school: user?.program !== 'ADMIN' ? user?.program : '', // Default to user's school if applicable
        venue: 'Jadcherla Campus - Main Auditorium',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        budget_requested: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Strict Role Check (Frontend Guard)
    if (!['director', 'event_coordinator', 'club_head', 'school_admin'].includes(user?.role)) {
        return (
            <div className="p-8 flex items-center justify-center flex-col text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
                <p className="text-slate-500">You do not have permission to host events.</p>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Basic Validation
            if (!form.title || !form.date || !form.start_time || !form.school) {
                throw new Error("Please fill in all required fields.");
            }

            // API Call
            const res = await api.post('/events', form); // Assumes api wrapper handles auth headers

            // Check logical success
            if (res.data.error) throw new Error(res.data.error);

            setSuccess(true);
            setTimeout(() => navigate(-1), 2000); // Go back after success

        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 md:p-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Host an Event</h1>
                <p className="text-slate-500">Submit an event proposal for Director approval.</p>
            </div>

            {success ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-scale-in">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
                    <h2 className="text-xl font-bold text-green-800 mb-2">Proposal Submitted!</h2>
                    <p className="text-green-600">Your event has been sent for approval. Redirecting...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {/* Title & School */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Event Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-nmims-primary focus:border-transparent outline-none transition-all"
                                placeholder="e.g. Tech Symposium 2026"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Organizing School <span className="text-red-500">*</span></label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-nmims-primary outline-none"
                                value={form.school}
                                onChange={e => setForm({ ...form, school: e.target.value })}
                            >
                                <option value="">Select School</option>
                                <option value="MPSTME">MPSTME (Engineering)</option>
                                <option value="SOPT">SOPT (Pharmacy)</option>
                                <option value="SBM">SBM (Management)</option>
                                <option value="SAMSOE">SAMSOE (Economics)</option>
                                <option value="SOL">SOL (Law)</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Description</label>
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-nmims-primary outline-none h-32 resize-none"
                            placeholder="Describe the event, objectives, and expected outcomes..."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Calendar size={14} /> Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-nmims-primary outline-none"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Clock size={14} /> Start Time <span className="text-red-500">*</span></label>
                            <input
                                type="time"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-nmims-primary outline-none"
                                value={form.start_time}
                                onChange={e => setForm({ ...form, start_time: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Clock size={14} /> End Time</label>
                            <input
                                type="time"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-nmims-primary outline-none"
                                value={form.end_time}
                                onChange={e => setForm({ ...form, end_time: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Venue & Budget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><MapPin size={14} /> Venue <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-nmims-primary outline-none"
                                placeholder="Details (e.g. Auditorium)"
                                value={form.venue}
                                onChange={e => setForm({ ...form, venue: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><DollarSign size={14} /> Budget Requested (INR)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-nmims-primary outline-none font-mono"
                                placeholder="0.00"
                                value={form.budget_requested}
                                onChange={e => setForm({ ...form, budget_requested: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center justify-end gap-4">
                        <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-nmims-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {loading ? 'Submitting...' : <><Send size={18} /> Submit Proposal</>}
                        </button>
                    </div>

                </form>
            )}
        </div>
    );
};

export default HostEvent;
