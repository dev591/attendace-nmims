
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import {
    Award, CheckCircle, TrendingUp, MapPin, Briefcase, Calendar, ShieldCheck, UserPlus, MessageCircle, Clock, Lock, Ban
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';

import config from '../utils/config';

const UserProfile = () => {
    const { user } = useStore();
    const { sapid } = useParams(); // Public param
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(false);

    const API_URL = config.API_URL;

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/student/${sapid}/portfolio`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            } else {
                setProfile(null);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const [connectionStatus, setConnectionStatus] = useState('none'); // none, requested, pending_approval, accepted

    const fetchRelationship = async () => {
        try {
            const res = await fetch(`${API_URL}/network/connection-status/${sapid}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConnectionStatus(data.status);
            }
        } catch (e) { console.error(e); }
    };

    const handleConnect = async () => {
        if (connectionStatus === 'none') {
            // Send Request
            const projectIdea = prompt("Pitch your collaboration idea (one liner):", "Building a Hackathon Project");
            if (!projectIdea) return;

            // Updated to use the correct endpoint from network_actions.js -> /connect
            // The existing code used /network/collab which maps to sending request.
            // My new backend endpoint is /connect. Let's use that one or ensure compatibility.
            // network_actions.js has router.post('/connect') logic.
            const res = await fetch(`${API_URL}/network/connect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ target_id: student.student_id }) // logic uses student_id, usually in profile.student.student_id
            });
            if (res.ok) setConnectionStatus('requested');
            else alert("Failed to send request.");
        } else if (connectionStatus === 'pending_approval') {
            alert("Check your pending requests in the Network page.");
        } else if (connectionStatus === 'accepted') {
            // Navigate to Chat
            window.location.href = `/student/${user.student_id}/chat`; // Using hard nav to ensure refresh or simple link
        }
    };

    useEffect(() => {
        if (sapid) {
            fetchProfile();
            fetchRelationship();
        }
    }, [sapid]);

    if (loading) return <div className="p-12 text-center text-slate-400">Loading Profile...</div>;
    if (!profile) return <div className="p-12 text-center text-red-400">Profile hidden or not found.</div>;

    const { student, skills, achievements, verifiedScore, badges } = profile;
    const isMe = user.sapid === sapid;
    const isFriend = connectionStatus === 'accepted';
    const canViewDetails = isMe || isFriend;

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans text-slate-900 relative">
            {/* HERO SECTION - PUBLIC VIEW */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-6 py-12">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="relative">
                            <img
                                src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${student.name}`}
                                alt="Profile"
                                className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-slate-100"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                                <ShieldCheck size={20} />
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{student.name}</h1>
                                    <p className="text-lg text-slate-500 mt-1">{student.program} • {student.dept}</p>
                                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-500 font-medium">
                                        <span className="flex items-center gap-1"><MapPin size={16} /> Mumbai, India</span>

                                        {/* Dynamic Connection Button */}
                                        {!isMe && (
                                            <button
                                                onClick={handleConnect}
                                                disabled={connectionStatus === 'requested'}
                                                className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all text-sm font-bold uppercase tracking-wider shadow-sm hover:shadow-md active:scale-95 ${connectionStatus === 'accepted' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                                                    connectionStatus === 'requested' ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' :
                                                        connectionStatus === 'pending_approval' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                                                            'bg-slate-900 text-white hover:bg-slate-800'
                                                    }`}
                                            >
                                                {connectionStatus === 'accepted' ? <><MessageCircle size={16} /> Message Buddy</> :
                                                    connectionStatus === 'requested' ? <><Clock size={16} /> Request Sent</> :
                                                        connectionStatus === 'pending_approval' ? <><CheckCircle size={16} /> Accept Buddy</> :
                                                            <><UserPlus size={16} /> Add Buddy</>}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right hidden md:block">
                                    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg inline-block text-center min-w-[120px]">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total XP</div>
                                        <div className="text-3xl font-bold font-mono text-emerald-400">{verifiedScore}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRIVACY CHECK */}
            {!canViewDetails ? (
                <div className="max-w-xl mx-auto mt-12 p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Lock size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">This Profile is Private</h3>
                    <p className="text-slate-500 mb-6">Connect with {student.name} to view their full skills, badges, and experience.</p>
                    <button
                        onClick={handleConnect}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-colors"
                    >
                        Send Connection Request
                    </button>
                </div>
            ) : (
                <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-bold text-lg mb-4">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {skills.map(skill => (
                                    <div key={skill.id} className="flex items-center gap-2 pr-2 overflow-hidden bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-700 group hover:border-indigo-200 transition-colors">
                                        <span className="px-3 py-1.5">{skill.skill_name}</span>
                                        <button
                                            onClick={async () => {
                                                const API_URL = config.API_URL;
                                                await fetch(`${API_URL}/network/endorse`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Authorization': `Bearer ${user.token}`,
                                                        'Content-Type': 'application/json'
                                                    },
                                                    body: JSON.stringify({ skill_id: skill.id, to_student_id: student.id })
                                                });
                                                alert(`Endorsed ${skill.skill_name}!`);
                                            }}
                                            className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors border-l border-slate-100"
                                            title="Endorse this skill"
                                        >
                                            <Award size={14} />
                                        </button>
                                    </div>
                                ))}
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
                            <h3 className="font-bold text-lg mb-6">Experience & Certifications</h3>
                            <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-100">
                                {achievements.filter(a => a.status === 'Approved').map((ach) => (
                                    <div key={ach.id} className="relative pl-12">
                                        <div className="absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 bg-emerald-100 text-emerald-600">
                                            <Award size={18} />
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg">{ach.title}</h4>
                                                <p className="text-slate-600 font-medium">{ach.provider}</p>
                                                <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                                    <Calendar size={14} /> {new Date(ach.date_completed).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold border border-emerald-100">
                                                <CheckCircle size={12} /> Verified
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {achievements.filter(a => a.status === 'Approved').length === 0 && (
                                    <p className="text-slate-400 pl-12 italic">No public certifications.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
