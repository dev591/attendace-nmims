/* ADDED BY ANTI-GRAVITY */
import React, { useState } from 'react';
import AttendanceOverviewCard from './AttendanceOverviewCard';
import MissCalculator from './MissCalculator';

export default function SubjectListWithAnalytics({ analyticsData }) {
    const [selectedSubject, setSelectedSubject] = useState(null);

    if (!analyticsData || analyticsData.length === 0) {
        return <div className="p-4 text-center text-gray-500">No attendance data available.</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 px-1 border-l-4 border-[#D50000] pl-3">
                My Attendance Analytics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.map(sub => (
                    <div key={sub.subject_id} className="flex flex-col">
                        <AttendanceOverviewCard
                            analytics={sub}
                            onClick={() => setSelectedSubject(selectedSubject === sub.subject_id ? null : sub.subject_id)}
                        />
                        {selectedSubject === sub.subject_id && (
                            <MissCalculator analytics={sub} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
