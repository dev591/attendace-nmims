/* ADDED BY ANTI-GRAVITY */
import React from "react";
import { motion } from "framer-motion";

export default function BadgeRow({ badges = [] }) {
    if (!badges || !badges.length) return null;

    return (
        <div className="w-full mb-6">
            <div className="flex justify-between items-end mb-2 px-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-widest">Achievements</h4>
                <span className="text-[10px] opacity-60">{badges.filter(b => !b.locked).length} Unlocked</span>
            </div>
            <div className="overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                <div className="flex gap-3">
                    {badges.map(b => (
                        <motion.div
                            key={b.id || b.title}
                            whileHover={{ scale: b.locked ? 1.01 : 1.05, y: -3 }}
                            className={`min-w-[200px] p-3 rounded-xl border border-white/10 backdrop-blur-md transition-colors ${b.locked
                                    ? "bg-gray-100/50 dark:bg-white/5 opacity-60 grayscale"
                                    : "bg-white/80 dark:bg-white/10 shadow-lg shadow-cyan-500/5 border-cyan-500/20"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner ${b.locked
                                        ? "bg-gray-200 dark:bg-white/5"
                                        : "bg-gradient-to-br from-cyan-400 to-teal-400 text-white shadow-cyan-500/30"
                                    }`}>
                                    {b.icon || (b.locked ? "🔒" : "⭐")}
                                </div>
                                <div>
                                    <div className="text-sm font-bold leading-tight mb-0.5">{b.title}</div>
                                    <div className="text-[10px] opacity-70 leading-tight">{b.desc}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
