
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';
import config from '../utils/config';

const PointsLeaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // No Auth needed for public leaderboard (or use token if preferred)
                const res = await fetch(`${config.API_URL}/gamification/leaderboard`);
                if (res.ok) setLeaders(await res.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getRankIcon = (index) => {
        if (index === 0) return <Crown size={18} className="text-yellow-500" />;
        if (index === 1) return <Medal size={18} className="text-slate-400" />;
        if (index === 2) return <Medal size={18} className="text-amber-700" />;
        return <span className="text-sm font-bold text-slate-400 w-5 text-center">{index + 1}</span>;
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={18} /> Hall of Fame
                </h3>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Top Learners</span>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="text-center text-slate-400 text-xs py-4">Updating ranks...</div>
                ) : leaders.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs italic py-4">Be the first to reach the top!</div>
                ) : (
                    leaders.map((student, i) => (
                        <motion.div
                            key={student.sapid}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`flex items-center justify-between p-3 rounded-xl transition-colors ${i === 0 ? 'bg-gradient-to-r from-yellow-50 to-white border border-yellow-100' : 'hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-6">
                                    {getRankIcon(i)}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900">{student.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{student.dept}</div>
                                </div>
                            </div>
                            <div className="font-bold text-indigo-600 text-sm">{student.score} pts</div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PointsLeaderboard;
