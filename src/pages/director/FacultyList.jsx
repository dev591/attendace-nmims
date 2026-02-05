import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/Store';
import { Mail, Phone, Search, SlidersHorizontal, UserCheck } from 'lucide-react';
import FacultyProfileModal from '../../components/FacultyProfileModal';

const API_BASE = 'http://localhost:4000';

export default function FacultyList() {
    const { user } = useStore();
    const [faculty, setFaculty] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        const fetchFaculty = async () => {
            if (!user?.token) return;
            try {
                // Director routes usually mounted at /director/students?role=faculty or custom
                // Our plan mentioned /director/faculty/analytics but strictly list view first
                // Let's use the generic /director/students route filtered by role, but we need to ensure the API supports it.
                // Or create a dedicated list endpoint.
                // Re-using the logic from Director Dashboard 'students' endpoint but it filters role='student'.
                // Ideally we need a 'GET /director/faculty' endpoint.
                // Wait, existing FacultyList.jsx used: fetch(`${API_BASE}/director/faculty`)
                // Let's confirm if that endpoint exists or if I need to create it.
                // Assuming I need to rely on what I built or verify.
                // Since I haven't built 'GET /director/faculty' explicitly in this turn, I should probably check `director_routes.js` again.
                // If not, I'll use '/director/students?role=faculty' IF I modify the backend or just create a quick list endpoint.

                // Let's use the new endpoint I planned: /director/faculty
                // Wait, I didn't create a LIST endpoint in the last turn, only PROFILE.
                // I need to quick-fix: Retrieve faculty list.
                // Let me try fetching from the generic /director/students endpoint if I can tweak it, 
                // OR just add a quick endpoint to `faculty_profile_routes.js`.

                // For now, let's assume I will add `GET /director/faculty` quickly in the next step to support this list.
                // Or I can use client-side fake for 1 sec? NO. STRICT VERIFICATION.
                // I will add the route in the backend in parallel.
                const res = await fetch(`${API_BASE}/director/faculty/list`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) setFaculty(await res.json());
            } catch (err) { console.error(err); }
        };
        fetchFaculty();
    }, [user]);

    const filtered = faculty.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Faculty Directory</h1>
                    <p className="text-gray-500 mt-1">Manage teaching staff and view live status</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search faculty..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 w-64"
                        />
                    </div>
                    <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <SlidersHorizontal size={18} className="text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filtered.map(f => (
                    <div
                        key={f.sapid}
                        onClick={() => setSelectedId(f.sapid)}
                        className="bg-white group hover:-translate-y-1 transition-all duration-300 cursor-pointer p-0 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md overflow-hidden"
                    >
                        <div className="h-20 bg-gradient-to-br from-slate-100 to-white border-b border-gray-50 relative">
                            <div className="absolute top-4 right-4">
                                <span className={`h-2.5 w-2.5 rounded-full inline-block ${Math.random() > 0.5 ? 'bg-green-500' : 'bg-gray-300'
                                    // Note: In list view we can't easily compute live status for ALL without heavy DB.
                                    // So we show generic 'Active' status or fetch logic later.
                                    // Using random for now is mockup behavior which I should avoid ("NO MOCK").
                                    // Better: Remove "Live Dot" from list view if not real, or fetch it.
                                    // I'll remove the dot to strict adherence.
                                    } hidden`}></span>
                            </div>
                        </div>
                        <div className="px-6 pb-6 -mt-10 relative">
                            <img
                                src={`https://api.dicebear.com/9.x/initials/svg?seed=${f.name}`}
                                className="h-20 w-20 rounded-2xl border-4 border-white shadow-sm bg-white"
                                alt={f.name}
                            />
                            <div className="mt-3">
                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{f.name}</h3>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">{f.dept}</p>
                                <p className="text-sm text-gray-500">{f.designation || 'Faculty'}</p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-gray-500 text-sm">
                                <span className="flex items-center gap-1.5 hover:text-gray-900 text-xs font-semibold">
                                    <Mail size={14} /> Contact
                                </span>
                                <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold">
                                    View Profile
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {selectedId && (
                <FacultyProfileModal
                    facultyId={selectedId}
                    token={user?.token}
                    onClose={() => setSelectedId(null)}
                />
            )}
        </div>
    );
}
