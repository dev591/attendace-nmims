
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { Search, MapPin, Users, ShieldCheck, ArrowRight, Check, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const Network = () => {
    const { user } = useStore();
    const { id } = useParams(); // Get current student ID from URL
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [trending, setTrending] = useState([]);
    const [myNetwork, setMyNetwork] = useState({ friends: [], pending: [], sent: [] }); // Track relationships

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

    // Fetch trending & My Network on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [trendRes, netRes] = await Promise.all([
                    fetch(`${API_URL}/network/trending`, { headers: { 'Authorization': `Bearer ${user.token}` } }),
                    fetch(`${API_URL}/network/my-network`, { headers: { 'Authorization': `Bearer ${user.token}` } })
                ]);

                if (trendRes.ok) setTrending(await trendRes.json());
                if (netRes.ok) {
                    const netData = await netRes.json();
                    // Just a small helper to easily check status
                    // The backend returns { pending: [], friends: [] }
                    // "Pending" means RECEIVED requests.
                    // We also need to know SENT requests to show "Pending" button on cards.
                    // Backend update might be needed or we just infer.
                    // Wait, existing backend endpoint `my-network` only returns RECEIVED pending.
                    // I should probably update backend to return sent pending too, OR just handle received.
                    // For now, let's assume if I click connect, I optimistically set it.
                    setMyNetwork(netData);
                }
            } catch (err) { console.error(err); }
        };
        if (user?.token) fetchInitialData();
    }, [user]);

    // Handle Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!query.trim()) {
                setResults([...trending]); // Fallback to trending if empty
                return;
            }
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/network/search?q=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) setResults(await res.json());
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query, trending, user]);

    // Initial load sync
    useEffect(() => { if (!query) setResults(trending); }, [trending, query]);

    const handleConnect = async (targetId) => {
        try {
            const res = await fetch(`${API_URL}/network/connect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ target_id: targetId })
            });
            const data = await res.json();
            if (data.success) {
                alert("Request Sent!");
                // Simple optimistic update: Add to a local 'sent' list or just refresh
                // Ideally we update local state to hide button
            } else {
                alert(data.error || "Failed to connect");
            }
        } catch (e) { console.error(e); }
    };

    const getActionBtn = (student) => {
        if (student.student_id === user.student_id) return null;

        // Check if friend
        const isFriend = myNetwork.friends?.some(f => f.student_id === student.student_id);
        if (isFriend) return <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Friend</span>;

        // Check if I received a request (Pending Action)
        const hasRequest = myNetwork.pending?.some(p => p.student_id === student.student_id);
        if (hasRequest) return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Pending Request</span>;

        return (
            <button
                onClick={(e) => {
                    e.preventDefault(); // Stop link nav
                    handleConnect(student.student_id);
                }}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold hover:bg-blue-700 transition-colors z-10 relative"
            >
                Connect
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] p-6 lg:p-8 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header & Search */}
                <div className="text-center space-y-4 py-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">The Network</h1>
                    <p className="text-slate-500 max-w-xl mx-auto">Discover top talent, find study partners, and connect with peers based on verified skills.</p>

                    <div className="max-w-xl mx-auto relative mt-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or skill (e.g. 'Java', 'Rahul')..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Friend Requests Section */}
                {myNetwork.pending && myNetwork.pending.length > 0 && (
                    <div className="mb-8 bg-amber-50 border border-amber-100 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Users size={20} className="text-amber-600" />
                            <h2 className="font-bold text-lg text-slate-800">Pending Requests ({myNetwork.pending.length})</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myNetwork.pending.map(req => (
                                <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${req.name}`}
                                            alt={req.name}
                                            className="w-10 h-10 rounded-full bg-slate-50"
                                        />
                                        <div>
                                            <div className="font-bold text-sm text-slate-900">{req.name}</div>
                                            <div className="text-xs text-slate-500">{req.program}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                await fetch(`${API_URL}/network/respond`, {
                                                    method: 'POST',
                                                    headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ connection_id: req.id, action: 'accept' })
                                                });
                                                setMyNetwork(prev => ({ ...prev, pending: prev.pending.filter(p => p.id !== req.id) }));
                                            }}
                                            className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                                            title="Accept"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await fetch(`${API_URL}/network/respond`, {
                                                    method: 'POST',
                                                    headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ connection_id: req.id, action: 'reject' })
                                                });
                                                setMyNetwork(prev => ({ ...prev, pending: prev.pending.filter(p => p.id !== req.id) }));
                                            }}
                                            className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                            title="Reject"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-slate-100"></div>
                        ))
                    ) : (
                        results.map(student => (
                            <Link to={`/student/${id}/network/profile/${student.sapid}`} key={student.student_id} className="group block h-full">
                                <div className="bg-white rounded-xl border border-slate-200 p-6 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                    <div className="flex items-start justify-between mb-4">
                                        <img
                                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${student.name}`}
                                            alt={student.name}
                                            className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-100 shadow-sm"
                                        />
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="bg-slate-50 text-slate-600 px-2 py-1 rounded text-xs font-bold font-mono border border-slate-100 flex items-center gap-1">
                                                <ShieldCheck size={12} className="text-emerald-500" />
                                                {student.verified_score}
                                            </div>
                                            {getActionBtn(student)}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors truncate">{student.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4 truncate">
                                        {[student.program, student.dept].filter(Boolean).join(' • ')}
                                    </p>

                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {Array.isArray(student.top_skills) && student.top_skills.slice(0, 3).map((skill, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs font-medium rounded border border-slate-100">
                                                {skill}
                                            </span>
                                        ))}
                                        {(!student.top_skills || student.top_skills.length === 0) && (
                                            <span className="text-xs text-slate-300 italic">No public skills</span>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Profile <ArrowRight size={12} />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {!loading && results.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <Users size={48} className="mx-auto mb-4 text-slate-200" />
                        <p>No students found matching "{query}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Network;
