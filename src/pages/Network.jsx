
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { Search, MapPin, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const Network = () => {
    const { user } = useStore();
    const { id } = useParams(); // Get current student ID from URL
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [trending, setTrending] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

    // Fetch trending on mount
    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await fetch(`${API_URL}/network/trending`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) setTrending(await res.json());
            } catch (err) { console.error(err); }
        };
        if (user?.token) fetchTrending();
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
                                        <div className="bg-slate-50 text-slate-600 px-2 py-1 rounded text-xs font-bold font-mono border border-slate-100 flex items-center gap-1">
                                            <ShieldCheck size={12} className="text-emerald-500" />
                                            {student.verified_score}
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
