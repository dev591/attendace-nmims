/* ADDED BY ANTI-GRAVITY */
import React, { useEffect, useState } from 'react';
import { getStudentOverview } from '../../lib/attendanceApi';
import { getSession } from '../../lib/session';
import SubjectListWithAnalytics from './SubjectListWithAnalytics';

export default function DebugAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { student_id, token } = getSession();
                if (!student_id || !token) return;

                const overview = await getStudentOverview(student_id, token);
                setData(overview);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <div className="p-4 animate-pulse">Loading Analytics Engine...</div>;
    if (error) return <div className="p-4 text-red-500">Error loading analytics: {error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* DEV ONLY BANNER */}
            <div className="bg-gray-800 text-white text-xs px-2 py-1 mb-4 inline-block rounded">
                DEV MODE: Attendance Analytics Integration
            </div>

            <SubjectListWithAnalytics analyticsData={data} />
        </div>
    );
}
