
import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/Store';
import {
    Award, CheckCircle, MapPin, ShieldCheck, ArrowLeft, BarChart2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const DirectorStudentProfile = () => {
    const { user } = useStore();
    const { sapid } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

    const fetchProfile = async () => {
        try {
            // Using the existing endpoint - Director permissions are handled by backend or logic
            // Since UserProfile uses public endpoint, we can reuse or create a specific one if needed.
            // For now, reusing the network public view but in a Director context is safe as it's read-only.
            const res = await fetch(`${API_URL}/student/${sapid}/portfolio`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (sapid) fetchProfile(); }, [sapid]);

    if (loading) return <div className="p-12 text-center text-slate-400">Loading Student Profile...</div>;
    if (!profile) return <div className="p-12 text-center text-red-400">Student not found.</div>;

    const { student, skills, achievements, verifiedScore, badges } = profile;

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans text-slate-900">
            {/* DIRECTOR HEADER */}
            <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <span className="font-mono text-sm opacity-70">DIRECTOR VIEW MODE</span>
                </div>
                <div className="flex gap-3">
                    {/* Placeholder for future actions */}
                    {/* <button className="bg-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-700">Report</button> */}
                </div>
            </div>

            {/* HERO SECTION */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-6 py-12">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="relative">
                            <img
                                src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${student.name}`}
                                alt="Profile"
                                className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-slate-100"
                            />
                            {verifiedScore > 100 && (
                                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                                    <ShieldCheck size={20} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{student.name}</h1>
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono font-bold border border-slate-200">
                                            {student.sapid}
                                        </span>
                                    </div>
                                    <p className="text-lg text-slate-500 mt-1">
                                        {[student.program, student.dept, student.year ? `Year ${student.year}` : null].filter(Boolean).join(' • ')}
                                    </p>

                                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-500 font-medium">
                                        {student.dream_company && (
                                            <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                                                Target: {student.dream_company}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1"><MapPin size={16} /> Campus Student</span>
                                    </div>
                                </div>

                                <div className="text-right hidden md:block">
                                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm inline-block text-center min-w-[120px]">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Verified Score</div>
                                        <div className="text-3xl font-bold font-mono text-emerald-600">{verifiedScore}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="space-y-6">
                    {/* Analytics Teaser */}
                    <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all" onClick={() => alert("Deep Analytics would open here")}>
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                                <BarChart2 size={20} className="text-blue-400" /> Performance
                            </h3>
                            <p className="text-slate-400 text-sm mb-4">View academic trends & detailed report.</p>
                            <span className="text-xs font-bold text-blue-300 group-hover:underline">View Analytics &rarr;</span>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-lg mb-4">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {skills.map(skill => (
                                <div key={skill.id} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-700">
                                    {skill.skill_name}
                                </div>
                            ))}
                            {skills.length === 0 && <span className="text-slate-400 italic text-sm">No skills listed.</span>}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-lg mb-4">Badges</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {badges.map((badge, i) => (
                                <div key={i} className="aspect-square rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl" title={badge.name}>
                                    {badge.icon || '🏅'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-lg mb-6">Verified Timeline</h3>
                        <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-100">
                            {achievements.map((ach) => (
                                <div key={ach.id} className="relative pl-12">
                                    <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${ach.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Award size={18} />
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">{ach.title}</h4>
                                            <p className="text-slate-600 font-medium">{ach.provider}</p>
                                            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                                {ach.type} • {new Date(ach.date_completed).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {ach.status === 'Approved' && (
                                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold border border-emerald-100">
                                                <CheckCircle size={12} /> Verified
                                            </div>
                                        )}
                                        {ach.status === 'Pending' && (
                                            <div className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold border border-amber-100">
                                                Pending Review
                                            </div>
                                        )}
                                        {ach.status === 'Rejected' && (
                                            <div className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-100">
                                                Rejected
                                            </div>
                                        )}
                                    </div>

                                    {/* DIRECTOR ACTIONS FOR PENDING ITEMS */}
                                    {ach.status === 'Pending' && (
                                        <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500">Action Required</span>
                                            <button
                                                onClick={() => navigate('/director/verify')}
                                                className="text-xs bg-black text-white px-3 py-1.5 rounded font-bold hover:bg-slate-800"
                                            >
                                                Go to Verify
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {achievements.length === 0 && (
                                <p className="text-slate-400 pl-12 italic">No certifications found.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DirectorStudentProfile;
