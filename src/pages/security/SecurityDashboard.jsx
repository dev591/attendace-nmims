import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/Store';
import { ShieldCheck, CheckCircle, AlertTriangle, MapPin, Clock, Search, AlertOctagon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const SecurityDashboard = () => {
    const { user } = useStore();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Open');

    useEffect(() => {
        fetchIncidents();
    }, [filter]);

    const fetchIncidents = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/incidents?status=${filter === 'All' ? '' : filter}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) setIncidents(await res.json());
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleResolve = async (id) => {
        const note = prompt("Resolution Notes:", "Investigated and resolved.");
        if (!note) return;

        try {
            const res = await fetch(`${API_BASE}/admin/incidents/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'Resolved', resolution_notes: note })
            });

            if (res.ok) {
                setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'Resolved' } : i));
                alert(`Incident #${id} marked as resolved.`);
            }
        } catch (e) {
            alert("Failed to update status");
        }
    };

    const getSeverityColor = (sev) => {
        switch (sev) {
            case 'Critical': return 'bg-red-500 text-white';
            case 'High': return 'bg-orange-500 text-white';
            case 'Medium': return 'bg-amber-400 text-slate-900';
            default: return 'bg-blue-500 text-white';
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading Security Console...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-mono">
            <div className="max-w-6xl mx-auto">

                <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center animate-pulse">
                            <AlertOctagon size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Security Command Center</h1>
                            <p className="text-red-400 text-sm font-bold">Live Incident Response</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {['Open', 'Resolved', 'All'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded font-bold uppercase text-xs transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {incidents.map(item => (
                        <div key={item.id} className={`bg-slate-800 border-l-4 ${item.status === 'Resolved' ? 'border-emerald-500' : 'border-red-500'} rounded-r-xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getSeverityColor(item.severity)}`}>
                                        {item.severity}
                                    </span>
                                    <span className="text-slate-500 text-xs">#{item.id}</span>
                                    <span className="text-slate-500 text-xs flex items-center gap-1">
                                        <Clock size={12} /> {new Date(item.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                                <p className="text-slate-400 text-sm">{item.description}</p>
                                <div className="mt-2 text-xs text-indigo-400">
                                    Reported By: {item.reported_by}
                                </div>
                            </div>

                            {item.status !== 'Resolved' ? (
                                <button
                                    onClick={() => handleResolve(item.id)}
                                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold uppercase text-xs flex items-center gap-2 transition-colors shadow-lg shadow-red-900/50"
                                >
                                    <CheckCircle size={16} /> Mark Resolved
                                </button>
                            ) : (
                                <div className="px-6 py-3 bg-slate-900/50 text-emerald-500 rounded font-bold uppercase text-xs flex items-center gap-2 border border-slate-700 cursor-default">
                                    <CheckCircle size={16} /> Resolved
                                </div>
                            )}

                        </div>
                    ))}

                    {incidents.length === 0 && (
                        <div className="border border-dashed border-slate-700 rounded-xl p-12 text-center text-slate-500">
                            No incidents found matching filter {filter}.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SecurityDashboard;
