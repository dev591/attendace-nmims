
import React, { useState } from 'react';
import { Award, Lock, AlertTriangle } from 'lucide-react';
import Card from './Card'; // Adjust path if needed

const AchievementsSection = ({ badges }) => {
    const [selectedBadge, setSelectedBadge] = useState(null);

    return (
        <div className="w-full">
            <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                <Award className="text-nmims-primary" /> Achievements
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge) => (
                    <div
                        key={badge.code}
                        onClick={() => setSelectedBadge(badge)}
                        className={`relative group cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col items-center text-center h-32 justify-between
                            ${badge.is_unlocked
                                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200 shadow-sm hover:shadow-md hover:scale-105'
                                : 'bg-gray-50 border-gray-200 grayscale opacity-70 hover:opacity-100'
                            }`}
                    >
                        <div className={`text-4xl mb-2 ${badge.is_unlocked ? 'animate-bounce-short' : ''}`}>
                            {badge.icon}
                        </div>

                        <div className="font-bold text-xs text-gray-800 leading-tight">
                            {badge.name}
                        </div>

                        {!badge.is_unlocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 rounded-xl">
                                <Lock size={24} className="text-gray-400" />
                            </div>
                        )}

                        {/* Info Icon Overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white rounded-full p-1 shadow-sm">
                                <AlertTriangle size={12} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL */}
            {selectedBadge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedBadge(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedBadge(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="text-6xl mb-4">{selectedBadge.icon}</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedBadge.name}</h3>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${selectedBadge.is_unlocked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {selectedBadge.is_unlocked ? 'Unlocked' : 'Locked'}
                            </div>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                {selectedBadge.description}
                            </p>

                            {/* Unlock Criteria */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 w-full text-left">
                                <h4 className="text-xs font-bold text-blue-800 uppercase mb-1 flex items-center gap-1">
                                    <Lock size={12} /> How to unlock
                                </h4>
                                <p className="text-sm text-blue-900">
                                    {selectedBadge.unlock_criteria || "Keep attending classes to reveal criteria!"}
                                </p>
                            </div>

                            {selectedBadge.is_unlocked && selectedBadge.awarded_at && (
                                <div className="mt-4 text-xs text-gray-400 font-mono">
                                    Awarded on: {new Date(selectedBadge.awarded_at).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AchievementsSection;
