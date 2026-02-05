import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, Crown, Zap, BookOpen, Code } from 'lucide-react';
import { useStore } from '../context/Store';
import config from '../utils/config';

export default function Leaderboard() {
    const { user } = useStore();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [category, setCategory] = useState('overall'); // 'overall', 'academic', 'skills'
    const [filterDept, setFilterDept] = useState('All'); // 'All', 'Computer', etc.

    useEffect(() => {
        const fetchLeaders = async () => {
            if (!user?.token) return;
            setLoading(true);
            try {
                const API_URL = config.API_URL;
                const deptQuery = filterDept === 'All' ? '' : `&dept=${filterDept}`;
                const res = await fetch(`${API_URL}/student/leaderboard?category=${category}${deptQuery}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });

                if (res.ok) {
                    setLeaders(await res.json());
                } else {
                    setLeaders([]);
                }
            } catch (err) {
                console.error("Leaderboard Fetch Error:", err);
                setLeaders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaders();
    }, [category, filterDept, user]);

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Leaderboard</h3>
                    </div>
                </div>
                {/* Dept Dropdown */}
                <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="All">All Depts</option>
                    <option value="Computer">Comp</option>
                    <option value="IT">IT</option>
                    <option value="AI/DS">AI/DS</option>
                    <option value="EXTC">EXTC</option>
                </select>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-50 rounded-xl mb-4 gap-1">
                {[
                    { id: 'overall', icon: Zap, label: 'XP' },
                    { id: 'academic', icon: BookOpen, label: 'Academic' },
                    { id: 'skills', icon: Code, label: 'Skills' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setCategory(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${category === tab.id
                            ? 'bg-white shadow-sm text-indigo-600 scale-105'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <tab.icon size={12} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center gap-2 text-slate-300">
                        <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                        <span className="text-xs">Ranking...</span>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                    {leaders.length === 0 ? (
                        <div className="text-center text-xs text-slate-400 py-8">No Champions Found</div>
                    ) : (
                        leaders.map((student, index) => {
                            let rankIcon;
                            if (index === 0) rankIcon = <Crown size={16} className="text-amber-500" fill="currentColor" />;
                            else if (index === 1) rankIcon = <Medal size={16} className="text-slate-400" />;
                            else if (index === 2) rankIcon = <Medal size={16} className="text-amber-700" />;
                            else rankIcon = <span className="text-xs font-bold text-slate-400">#{index + 1}</span>;

                            return (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all relative ${student.isUser ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="w-6 flex justify-center">{rankIcon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`text-sm font-bold truncate ${student.isUser ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                {student.name}
                                            </div>
                                            {student.streak > 5 && (
                                                <div className="flex items-center gap-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 rounded-full border border-orange-200" title={`${student.streak} day streak`}>
                                                    🔥 {student.streak}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                            <span className="bg-slate-100 px-1 rounded">{student.dept}</span>
                                            {category === 'overall' && <span>Attributes: {Math.round(student.academic_xp)} AC / {student.skill_xp} SK</span>}
                                            {category === 'skills' && <span>{student.skill_xp} Skill XP</span>}
                                            {category === 'academic' && <span>{student.academic_xp} Acad XP</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold text-sm ${student.isUser ? 'text-indigo-700' : 'text-slate-900'}`}>
                                            {category === 'overall' ? student.total_xp : (category === 'skills' ? student.skill_xp : student.academic_xp)}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase">XP</div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
