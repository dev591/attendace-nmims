import React, { useState, useEffect } from 'react';
import { Shield, FileText, CheckCircle, Search, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../../context/Store';

const SystemAudit = () => {
    const { user } = useStore();
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = 'http://localhost:4000/director/audit-logs';
            if (filter !== 'all') url += `?type=${filter}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setLogs(data);
        } catch (e) {
            console.error("Failed to fetch logs", e);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'appeal': return 'text-orange-400 bg-orange-400/10';
            case 'achievement': return 'text-purple-400 bg-purple-400/10';
            case 'lost_item': return 'text-blue-400 bg-blue-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        System Audit Logs
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Traceability for every critical action.
                    </p>
                </div>

                <div className="flex gap-2">
                    {['all', 'appeal', 'achievement', 'lost_item'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </header>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 text-slate-400 text-sm font-medium">
                    <div className="col-span-2">Timestamp</div>
                    <div className="col-span-2">Action</div>
                    <div className="col-span-2">Actor</div>
                    <div className="col-span-2">Entity</div>
                    <div className="col-span-4">Change Details</div>
                </div>

                <div className="divide-y divide-slate-800/50">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading trail...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No logs found.</div>
                    ) : (
                        logs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-800/30 transition-colors items-center text-sm"
                            >
                                <div className="col-span-2 text-slate-400 font-mono text-xs">
                                    {new Date(log.created_at).toLocaleString()}
                                </div>
                                <div className="col-span-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeColor(log.entity_type)}`}>
                                        {log.action_type}
                                    </span>
                                </div>
                                <div className="col-span-2 text-slate-300">
                                    {log.actor_role === 'director' && <Shield size={14} className="inline mr-1 text-emerald-400" />}
                                    {log.actor_id}
                                </div>
                                <div className="col-span-2 text-slate-500 font-mono text-xs">
                                    {log.entity_type.toUpperCase()} #{log.entity_id}
                                </div>
                                <div className="col-span-4 text-slate-400">
                                    {log.changes && Object.entries(log.changes).map(([key, val]) => (
                                        <div key={key} className="flex gap-2">
                                            <span className="text-slate-500">{key}:</span>
                                            <span className="text-emerald-300">
                                                {typeof val === 'object' ? `${val.old || '-'} → ${val.new}` : val}
                                            </span>
                                        </div>
                                    ))}
                                    {log.metadata?.security_note && (
                                        <div className="text-xs text-orange-300 mt-1">
                                            Note: {log.metadata.security_note}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemAudit;
