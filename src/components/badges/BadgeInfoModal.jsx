/* ADDED BY ANTI-GRAVITY */
import React from 'react';

function humanizeCriteria(c) {
    if (!c) return '';
    const t = c.type;
    switch (t) {
        case 'streak': return `Attend ${c.days} classes in a row.`;
        case 'perfect_week': return `Attend all classes in a week (${c.week_days || 7} days).`;
        case 'subject_pct': return `Maintain ${c.pct}% attendance in subject ${c.subject_id}.`;
        case 'overall_pct': return `Maintain ${c.pct}% overall attendance.`;
        case 'semester_pct': return `Reach ${c.pct}% by semester end.`;
        case 'event': return `Trigger event: ${c.event_name}.`;
        case 'cross_subject_sequence': return `Attend ${c.count} different subjects in sequence.`;
        default: return JSON.stringify(c);
    }
}

export default function BadgeInfoModal({ badge, onClose }) {
    if (!badge) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl transform scale-100 transition-transform">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-xl">
                            {badge.unlocked ? '🎉' : '🔒'}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{badge.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${badge.unlocked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {badge.unlocked ? 'Unlocked' : 'Locked'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-6 leading-relaxed">{badge.description}</p>

                <div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100">
                    <div className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-1">Requirement</div>
                    <div className="text-gray-700 font-medium">{humanizeCriteria(badge.criteria)}</div>
                </div>

                {badge.locked && (
                    <div className="mt-4 text-xs text-center text-gray-400 italic">
                        Keep attending classes to unlock this badge!
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
