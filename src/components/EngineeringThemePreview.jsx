/* ADDED BY ANTI-GRAVITY */
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, TrendingUp, Cpu } from 'lucide-react';

const EngineeringThemePreview = () => {
    return (
        <div className="relative w-full p-6 overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-md">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-blueprint opacity-20" />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">

                {/* Hero Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="glass-card p-6 rounded-2xl w-full md:w-1/3 flex flex-col items-center text-center border-t border-cyan-500/30"
                >
                    <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 ring-2 ring-cyan-400/30">
                        <Cpu className="w-10 h-10 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                        Engineering 2.0
                    </h3>
                    <p className="text-sm text-cyan-100/60 mt-2">System Optimized</p>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-accent mt-6 px-6 py-2 w-full shadow-lg shadow-cyan-500/20"
                    >
                        Initialize
                    </motion.button>
                </motion.div>

                {/* Stats & Progress */}
                <div className="flex-1 space-y-6 w-full">
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard icon={Zap} label="Streak" value="12 Days" color="text-yellow-400" delay={0.1} />
                        <StatCard icon={Trophy} label="Rank" value="#42" color="text-purple-400" delay={0.2} />
                    </div>

                    <div className="glass-card p-4 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-cyan-200">Core Architecture</span>
                            <span className="font-mono text-cyan-400">87%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "87%" }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="glass-card p-4 rounded-xl flex items-center gap-3 border border-white/5 bg-white/5"
    >
        <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
            <Icon size={20} />
        </div>
        <div>
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-lg font-bold font-mono">{value}</p>
        </div>
    </motion.div>
);

export default EngineeringThemePreview;
