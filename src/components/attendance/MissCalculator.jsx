/* ADDED BY ANTI-GRAVITY */
import React, { useState, useEffect } from 'react';

export default function MissCalculator({ analytics }) {
    const [missCount, setMissCount] = useState(0);
    const [simulatedPct, setSimulatedPct] = useState(analytics?.attendance_percentage ?? 0);
    const [simulatedRisk, setSimulatedRisk] = useState('low');

    // Safe Destructuring
    const safeAnalytics = analytics || {};
    const {
        subject_name,
        percentage = safeAnalytics.attendance_percentage ?? 0,
        conducted = safeAnalytics.sessions_conducted ?? 0,
        attended = safeAnalytics.attended_classes ?? 0,
        absent_so_far = safeAnalytics.missed_classes ?? (conducted - attended),
        max_allowed_absent = safeAnalytics.allowed_absences ?? (safeAnalytics.stats?.canMiss ?? 5)
    } = safeAnalytics;

    useEffect(() => {
        if (!analytics) return;

        // Calculate simulation
        // Calculate simulation
        // If I miss 'missCount' MORE classes:
        // New Conducted = conducted + missCount
        // New Attended = attended (unchanged)

        // Wait, "Miss next X classes" means future sessions.
        // Assuming we look ahead.
        const newConducted = conducted + missCount;
        const newPercentage = newConducted > 0 ? (attended / newConducted) * 100 : 0;

        setSimulatedPct(parseFloat(newPercentage.toFixed(2)));

        // Risk check (using 80% logic)
        // Hardcoded minPct here or use analytics.min_attendance_pct if available (backend didn't send it explicitly in top level, but used it)
        // Assuming 80 is the standard for visual feedback
        if (newPercentage < 80) setSimulatedRisk('high');
        else if (newPercentage < 83) setSimulatedRisk('moderate');
        else setSimulatedRisk('low');

    }, [missCount, conducted, attended]);

    const nmimsRed = '#D50000';

    return (
        <div className="bg-white border-t border-gray-100 p-4 mt-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                "What if I miss more classes?" for {subject_name}
            </h4>

            <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={missCount}
                        onChange={(e) => setMissCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Current</span>
                        <span>Miss 10 more</span>
                    </div>
                </div>
                <div className="w-24 text-right">
                    <div className="text-2xl font-bold" style={{ color: simulatedRisk === 'high' ? nmimsRed : '#333' }}>
                        {simulatedPct}%
                    </div>
                    <div className="text-xs text-gray-500">
                        Top miss: {missCount}
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 border border-gray-100">
                You have missed <strong>{absent_so_far}</strong> classes so far.
                Average allowed misses for 80%: <strong>{max_allowed_absent}</strong> (Total).
                {max_allowed_absent - absent_so_far - missCount < 0
                    ? <span className="block mt-1 text-red-600 font-medium">⚠️ DANGER: You will cross the safe limit!</span>
                    : <span className="block mt-1 text-green-600 font-medium">✅ You are within safe limits.</span>}
            </div>
        </div>
    );
}
