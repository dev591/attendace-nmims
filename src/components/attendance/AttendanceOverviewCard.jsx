/* ADDED BY ANTI-GRAVITY */
import React from 'react';

// Design: Minimalist White Card, Red Accents
const NMIMS_RED = '#D50000';

export default function AttendanceOverviewCard({ analytics, onClick }) {
    if (!analytics) return null;

    const {
        subject_name,
        // Support both Strict and Legacy namings
        attendance_percentage = analytics.percentage ?? 0,
        sessions_conducted = analytics.conducted ?? 0,
        attended_classes = analytics.attended ?? 0,
        // Legacy or Computed
        risk_level = (analytics.attendance_percentage ?? analytics.percentage ?? 0) < 75 ? 'high' : 'low',
        can_still_miss = analytics.can_still_miss ?? 0
    } = analytics;

    // Normalize for display
    const finalPct = attendance_percentage;
    const finalTotal = sessions_conducted;
    const finalAttended = attended_classes;
    const finalRisk = finalPct < 75 ? 'high' : (finalPct < 80 ? 'moderate' : 'low'); // Overwrite with strict logic


    // Badge Color
    let badgeColor = 'bg-gray-100 text-gray-800';
    if (finalRisk === 'low') badgeColor = 'bg-green-100 text-green-800';
    if (finalRisk === 'moderate') badgeColor = 'bg-yellow-100 text-yellow-800';
    if (finalRisk === 'high') badgeColor = 'bg-red-100 text-red-800';

    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 truncate pr-2">{subject_name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium uppercase ${badgeColor}`}>
                    {finalRisk} Risk
                </span>
            </div>

            <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-800">{finalPct}%</span>
                <span className="text-sm text-gray-500 mb-1">attendance</span>
            </div>

            <div className="text-xs text-gray-500 flex justify-between">
                <span>{finalAttended} / {finalTotal} Sessions</span>
                {can_still_miss > 0 && (
                    <span className="text-green-600 font-medium">Safe to miss {can_still_miss}</span>
                )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-1.5 mt-3 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${Math.min(100, finalPct)}%`,
                        backgroundColor: finalPct < 75 ? NMIMS_RED : (finalPct < 80 ? '#F59E0B' : '#10B981')
                    }}
                />
            </div>
        </div>
    );
}
