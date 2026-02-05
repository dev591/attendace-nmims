
import React, { useState } from 'react';
import { useStore } from '../../context/Store';
import { Megaphone, Send } from 'lucide-react';
import config from '../../utils/config';

const API_BASE = config.API_URL;

export default function Announcements() {
    const { user } = useStore();
    const [title, setTitle] = useState('');
    const [msg, setMsg] = useState('');
    const [target, setTarget] = useState('all');
    const [targetVal, setTargetVal] = useState('');
    const [status, setStatus] = useState(null);

    const handlePost = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/director/announcements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    title,
                    message: msg,
                    target_group: target,
                    target_value: targetVal
                })
            });

            if (res.ok) {
                setStatus('sent');
                setTitle(''); setMsg('');
                setTimeout(() => setStatus(null), 3000);
            } else {
                setStatus('error');
            }
        } catch (err) { setStatus('error'); }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Post Announcement</h1>
            <p className="text-gray-500 mb-8">Broadcast messages to students or specific groups.</p>

            <form onSubmit={handlePost} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        required
                        type="text"
                        name="xb_title"
                        id="xb_title"
                        autoComplete="off"
                        value={title} onChange={e => setTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="e.g. Exam Schedule Released"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                        required
                        rows={4}
                        name="xb_message"
                        id="xb_message"
                        autoComplete="off"
                        value={msg} onChange={e => setMsg(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="Type your message here..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                        <select
                            value={target} onChange={e => setTarget(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        >
                            <option value="all">All Students</option>
                            <option value="student">Specific Student (SAPID)</option>
                            {/* Future: School/Batch */}
                        </select>
                    </div>
                    {target === 'student' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SAP ID</label>
                            <input
                                type="text"
                                value={targetVal} onChange={e => setTargetVal(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="e.g. S9000050"
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Send size={18} /> Post Announcement
                    </button>
                    {status === 'sent' && <p className="text-green-600 text-sm text-center mt-2">✅ Announcement Sent!</p>}
                    {status === 'error' && <p className="text-red-600 text-sm text-center mt-2">❌ Failed to send.</p>}
                </div>
            </form>
        </div>
    );
}
