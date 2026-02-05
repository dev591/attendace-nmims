import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { Search, MapPin, Camera, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import config from '../utils/config';

const API_BASE = config.API_URL;

const LostFound = () => {
    const { user } = useStore();
    const [activeTab, setActiveTab] = useState('feed'); // feed, report, my
    const [feedItems, setFeedItems] = useState([]);
    const [myItems, setMyItems] = useState([]);

    // Form State
    const [formData, setFormData] = useState({ item_name: '', description: '', location_lost: '' });
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (activeTab === 'feed') fetchFeed();
        if (activeTab === 'my') fetchMyReports();
    }, [activeTab]);

    const fetchFeed = async () => {
        try {
            const res = await fetch(`${API_BASE}/college/lost-found/feed`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) setFeedItems(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchMyReports = async () => {
        try {
            const res = await fetch(`${API_BASE}/college/lost-found/my`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) setMyItems(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('item_name', formData.item_name);
            data.append('description', formData.description);
            data.append('location_lost', formData.location_lost);
            data.append('image', imageFile);

            const res = await fetch(`${API_BASE}/college/lost-found/report`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: data
            });

            if (res.ok) {
                alert("Report submitted! Sent to Security Head for verification.");
                setActiveTab('my');
                setFormData({ item_name: '', description: '', location_lost: '' });
                setImageFile(null);
                setPreviewUrl(null);
            } else {
                alert("Failed to report.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-24 font-sans">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">LOST & FOUND</h1>
                        <p className="text-slate-500 font-medium">Reuniting students with their precious items.</p>
                    </div>

                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        {['feed', 'report', 'my'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${activeTab === tab
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {tab === 'feed' && 'Campus Feed'}
                                {tab === 'report' && 'Report Lost'}
                                {tab === 'my' && 'My Reports'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <AnimatePresence mode='wait'>

                    {/* 1. CAMPUS FEED */}
                    {activeTab === 'feed' && (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                        >
                            {feedItems.length > 0 ? feedItems.map(item => (
                                <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-shadow group">
                                    <div className="h-48 bg-slate-100 relative overflow-hidden">
                                        <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-700 flex items-center gap-1 shadow-sm">
                                            <MapPin size={12} className="text-red-500" /> {item.location_lost || 'Unknown'}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-slate-900">{item.item_name}</h3>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                            <div className="text-xs font-bold text-slate-400 uppercase">Reported by {item.reporter_name}</div>
                                            <div className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded">
                                                Active
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-20 text-center text-slate-400">
                                    <CheckCircle className="mx-auto mb-4 w-12 h-12 text-slate-200" />
                                    No lost items reported currently. Good news!
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* 2. REPORT FORM */}
                    {activeTab === 'report' && (
                        <motion.div
                            key="report"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-xl mx-auto bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100"
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                    <AlertTriangle size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Lost Something Precious?</h2>
                                <p className="text-slate-500 mt-1">We'll help you transmit this to the whole campus.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Upload Photo (Required)</label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:bg-slate-50 transition-colors text-center cursor-pointer relative">
                                        <input type="file" required accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="h-40 mx-auto rounded-lg object-contain shadow-sm" />
                                        ) : (
                                            <div className="text-slate-400">
                                                <Camera size={32} className="mx-auto mb-2" />
                                                <span className="text-sm font-bold">Tap to snap or upload</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Item Name</label>
                                    <input type="text" required value={formData.item_name} onChange={e => setFormData({ ...formData, item_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-slate-900" placeholder="e.g. Apple Watch Series 7" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                    <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-slate-900 h-24 resize-none" placeholder="Color, distinguishing marks, etc..." />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Last seen location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                        <input type="text" value={formData.location_lost} onChange={e => setFormData({ ...formData, location_lost: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 font-medium outline-none focus:ring-2 focus:ring-slate-900" placeholder="e.g. 5th Floor Cafeteria" />
                                    </div>
                                </div>

                                <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50">
                                    {submitting ? 'Transmitting...' : 'Submit Report'}
                                </button>
                                <p className="text-xs text-center text-slate-400 mt-4">
                                    Requires approval from Security Head before posting.
                                </p>
                            </form>
                        </motion.div>
                    )}

                    {/* 3. MY REPORTS */}
                    {activeTab === 'my' && (
                        <motion.div
                            key="my"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            {myItems.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                        <img src={item.image_url} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900">{item.item_name}</h4>
                                        <div className="text-xs text-slate-500 mt-1">Reported on {new Date(item.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${item.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                        {item.status}
                                    </div>
                                </div>
                            ))}
                            {myItems.length === 0 && (
                                <div className="text-center py-10 text-slate-400">You haven't reported anything yet.</div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>

            </div>
        </div>
    );
};

export default LostFound;
