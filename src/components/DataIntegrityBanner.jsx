/* ADDED BY ANTI-GRAVITY */
import React, { useEffect, useState } from 'react';
import config from '../utils/config';

export default function DataIntegrityBanner() {
    const [counts, setCounts] = useState({ students: null, sessions: null, attendance: null });
    const isDev = import.meta.env.MODE !== 'production';

    useEffect(() => {
        if (!isDev) return;
        Promise.all([
            fetch(`${config.API_URL}/debug/counts/students`).then(r => r.json()),
            fetch(`${config.API_URL}/debug/counts/sessions`).then(r => r.json()),
            fetch(`${config.API_URL}/debug/counts/attendance`).then(r => r.json())
        ]).then(([s, ses, att]) => {
            setCounts({ students: s.count, sessions: ses.count, attendance: att.count });
        }).catch(err => console.error("Integrity check failed", err));
    }, []);

    if (!isDev) return null; // Remove for production

    const hasData = counts.students > 0 && counts.sessions > 0;
    const isRed = !hasData;

    return (
        <div className={`w-full py-1 px-4 text-xs font-mono flex justify-between items-center ${isRed ? 'bg-red-600 text-white' : 'bg-gray-800 text-green-400'}`}>
            <div className="flex gap-4">
                <span className="font-bold">DATA INTEGRITY:</span>
                <span>Students: {counts.students ?? '-'}</span>
                <span>Sessions: {counts.sessions ?? '-'}</span>
                <span>Attendance: {counts.attendance ?? '-'}</span>
            </div>
            {isRed && <span className="font-bold underline cursor-help" title="Run backend/demo_seed_for_testing.sql">NO DATA — IMPORT REQUIRED</span>}
        </div>
    );
}
