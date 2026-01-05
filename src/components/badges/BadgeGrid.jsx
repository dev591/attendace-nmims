/* ADDED BY ANTI-GRAVITY */
import React, { useEffect, useState } from 'react';
import { getStudentBadges } from '../../lib/badgesApi';
import BadgeCard from './BadgeCard';
import BadgeInfoModal from './BadgeInfoModal';

export default function BadgeGrid({ studentId, token }) {
    const [badges, setBadges] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBadges() {
            try {
                const data = await getStudentBadges(studentId, token);
                if (Array.isArray(data)) setBadges(data);
            } catch (e) { console.error("Badges fetch failed", e); }
            finally { setLoading(false); }
        }
        if (studentId) fetchBadges();
    }, [studentId, token]);

    if (loading) return <div className="p-4 text-xs text-gray-400">Loading achievements...</div>;

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Achievements</h3>
                <span className="text-xs text-gray-500 font-medium">{badges.filter(b => b.unlocked).length} / {badges.length} Unlocked</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {badges.map(b => (
                    <BadgeCard key={b.badge_key} badge={b} locked={!b.unlocked} onInfo={() => setSelected(b)} />
                ))}
            </div>

            <BadgeInfoModal badge={selected} onClose={() => setSelected(null)} />
        </div>
    );
}
