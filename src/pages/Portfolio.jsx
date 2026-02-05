
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, CheckCircle, Plus, Trash2,
    MapPin, Briefcase, Calendar, ShieldCheck,
    Rocket, Edit3, Github, Linkedin, Target, Bot, Zap, Sparkles, Layout, Users
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import CareerCoach from './CareerCoach';
import { UploadModal } from './Achievements';

const Portfolio = () => {
    const { user } = useStore();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, coach, network
    const [newSkill, setNewSkill] = useState('');
    const [addingSkill, setAddingSkill] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/student/${user.id}/portfolio`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                if (data.student && !data.student.is_onboarded) {
                    navigate('/onboarding');
                }
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (user?.id) fetchProfile(); }, [user]);

    const handleAddSkill = async (e) => {
        e.preventDefault();
        if (!newSkill.trim()) return;
        setAddingSkill(true);
        try {
            await fetch(`${API_URL}/student/skill`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ skill_name: newSkill, category: 'Tech' })
            });
            setNewSkill('');
            fetchProfile();
        } catch (err) { console.error(err); }
        finally { setAddingSkill(false); }
    };

    if (loading) return <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-slate-400">Loading Profile...</div>;
    if (!profile) return <div className="min-h-screen bg-[#F8F9FA] text-red-400 flex items-center justify-center">Failed to load profile.</div>;

    const { student, skills, achievements, verifiedScore, badges } = profile;

    // TABBED LAYOUT (CLEAN & PROFESSIONAL)
    return (
        <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 font-sans text-slate-900 pb-24">
            <div className="max-w-[1200px] mx-auto space-y-6">

                {/* 1. PROFESSIONAL HEADER */}
                <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
                    {/* Background Accent */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-slate-200 to-slate-100" />

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <img
                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${student.name}`}
                            alt="Profile"
                            className="w-28 h-28 rounded-xl border-4 border-white shadow-md bg-slate-50 mt-2"
                        />
                        {verifiedScore > 100 && (
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1 rounded-lg border-2 border-white shadow-sm" title="Verified Identity">
                                <ShieldCheck size={16} />
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 text-center md:text-left space-y-3">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{student.name}</h1>
                            <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 text-sm mt-1">
                                {student.program} <span className="text-slate-300">•</span> {student.dept}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            {student.dream_company && (
                                <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                                    <Target size={12} /> {student.dream_company}
                                </span>
                            )}
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5">
                                <Briefcase size={12} /> {student.career_goal || 'Student'}
                            </span>
                            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 ml-2">
                                <span className="text-xs text-slate-400 font-medium">Verified Score:</span>
                                <span className="text-sm font-mono font-bold text-emerald-600">{verifiedScore}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-col gap-3 shrink-0">
                        <button onClick={() => navigate('/onboarding')} className="border border-slate-200 hover:border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-white">
                            <Edit3 size={14} /> Edit Profile
                        </button>
                        <div className="flex gap-2 justify-end">
                            {student.linkedin_url && <a href={`https://${student.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-[#0077b5] transition-colors"><Linkedin size={20} /></a>}
                            {student.github_url && <a href={`https://${student.github_url}`} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-black transition-colors"><Github size={20} /></a>}
                        </div>
                    </div>
                </div>

                {/* 2. TABS */}
                <div className="border-b border-slate-200 flex gap-8 px-4">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-4 text-sm font-medium transition-all relative ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Overview
                        {activeTab === 'overview' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('coach')}
                        className={`pb-4 text-sm font-medium transition-all relative ${activeTab === 'coach' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Career Pilot
                        {activeTab === 'coach' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('network')}
                        className={`pb-4 text-sm font-medium transition-all relative ${activeTab === 'network' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Network
                        {activeTab === 'network' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
                    </button>
                </div>

                {/* 3. TAB CONTENT */}
                <div className="min-h-[500px]">
                    <AnimatePresence mode="wait">

                        {/* TAB: OVERVIEW */}
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                            >
                                {/* Left Column: Journey (Wide) */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-slate-800 text-lg">Experience & Journey</h3>
                                            <button onClick={() => setShowUploadModal(true)} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5">
                                                <Plus size={16} /> Add Position
                                            </button>
                                        </div>

                                        <div className="space-y-8 relative pl-2">
                                            <div className="absolute left-[23px] top-2 bottom-2 w-px bg-slate-100" />
                                            {achievements.length === 0 ? (
                                                <div className="text-center py-12 pl-8 border-2 border-dashed border-slate-50 rounded-xl">
                                                    <p className="text-slate-400 text-sm">No verified experience yet.</p>
                                                </div>
                                            ) : (
                                                achievements.map((ach) => (
                                                    <div key={ach.id} className="relative pl-10 group">
                                                        <div className={`absolute left-[19px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10 ${ach.status === 'Approved' ? 'bg-emerald-500' : 'bg-slate-300'}`} />

                                                        <div className="border-b border-slate-50 pb-6 group-last:border-0 group-last:pb-0">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-bold text-slate-800 text-base">{ach.title}</h4>
                                                                    <p className="text-sm text-slate-500 mt-0.5">{ach.provider}</p>
                                                                </div>
                                                                {ach.status === 'Approved' && <CheckCircle size={16} className="text-emerald-500" />}
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                                                                <span>{new Date(ach.date_completed).toLocaleDateString()}</span>
                                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                                <span className="uppercase tracking-wider font-medium">{ach.type}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Skills & Badges (Narrow Sidebar) */}
                                <div className="space-y-6">
                                    {/* Skills */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Skills</h3>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {skills.map(skill => (
                                                <span key={skill.id} className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded text-xs font-medium text-slate-600 hover:border-slate-300 transition-colors cursor-default">
                                                    {skill.skill_name}
                                                </span>
                                            ))}
                                        </div>
                                        <form onSubmit={handleAddSkill}>
                                            <input
                                                value={newSkill} onChange={e => setNewSkill(e.target.value)}
                                                placeholder="+ Add skill"
                                                className="w-full bg-slate-50 px-3 py-2 rounded-lg text-xs border border-slate-100 focus:outline-none focus:border-blue-500 transition-all font-medium"
                                            />
                                        </form>
                                    </div>

                                    {/* Badges */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Badges</h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {badges.map((badge, i) => (
                                                <div key={i} className="aspect-square rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xl hover:bg-slate-100 transition-colors" title={badge.name}>
                                                    {badge.icon || '🏅'}
                                                </div>
                                            ))}
                                            {badges.length === 0 && <span className="text-xs text-slate-400 col-span-4">No earned badges.</span>}
                                        </div>
                                    </div>

                                    {/* Career Pilot Teaser - Only if not on that tab */}
                                    <div
                                        onClick={() => setActiveTab('coach')}
                                        className="bg-indigo-600 rounded-xl p-5 text-white cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm group"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <Bot size={20} className="text-indigo-200" />
                                            <span className="font-bold text-sm">Career Pilot</span>
                                        </div>
                                        <p className="text-xs text-indigo-100 leading-relaxed mb-3">
                                            Need career advice? Start a session with your AI coach.
                                        </p>
                                        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                                            Open Chat <Rocket size={12} />
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB: CAREER PILOT */}
                        {activeTab === 'coach' && (
                            <motion.div
                                key="coach"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[600px] flex flex-col"
                            >
                                <CareerCoach user={user} compact={false} />
                            </motion.div>
                        )}

                        {/* TAB: NETWORK (Placeholder) */}
                        {activeTab === 'network' && (
                            <motion.div
                                key="network"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center"
                            >
                                <Users className="mx-auto text-slate-300 mb-4" size={48} />
                                <h3 className="font-bold text-slate-800 text-lg">My Network</h3>
                                <p className="text-slate-500 mb-6">Connect with peers to expand your opportunities.</p>
                                <button onClick={() => navigate('/network')} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                    Browse Directory
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

            </div>

            <AnimatePresence>
                {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onUpload={fetchProfile} />}
            </AnimatePresence>
        </div>
    );
};

export default Portfolio;
