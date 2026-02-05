
import React, { useState, useLayoutEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/Store';
import { ShieldCheck, User, Lock, Loader2, ArrowLeft, ArrowRight, CheckCircle, BarChart2, Briefcase, Users, Zap, Globe, Bot, Sparkles, Target, Award } from 'lucide-react';
import HeroBG from '../assets/hero_bg.png';
import NMIMSLogo from '../assets/nmims_logo.png';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
    const navigate = useNavigate();
    const { login } = useStore();
    const [searchParams] = useSearchParams();

    // Default to 'director' if ?mode=director is in URL, else 'student'
    const [loginType, setLoginType] = useState(searchParams.get('mode') === 'director' ? 'director' : 'student');

    const [loading, setLoading] = useState(false);
    const [sapid, setSapid] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const containerRef = useRef(null);

    // --- ANIMATIONS ---
    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            const tl = gsap.timeline();

            // 1. Initial State
            gsap.set(".login-card", { y: 100, opacity: 0, rotateX: 10 });
            gsap.set(".hero-text", { y: 50, opacity: 0 });

            // 2. Entrance
            tl.to(".login-card", {
                y: 0,
                rotateX: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power3.out"
            });

            tl.to(".hero-text", {
                y: 0,
                opacity: 1,
                stagger: 0.2,
                duration: 1,
                ease: "power2.out"
            }, "-=0.8");

            // Scroll Animations for Sections
            gsap.utils.toArray('.showcase-section').forEach(section => {
                gsap.from(section, {
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%",
                    },
                    y: 50,
                    opacity: 0,
                    duration: 1,
                    ease: "power2.out"
                });
            });

        }, containerRef);
        return () => ctx.revert();
    }, []);

    async function handleLogin(e) {
        if (e) e.preventDefault();
        setError("");

        let payloadSapid = sapid;
        if (loginType === 'director') {
            payloadSapid = 'DIRECTOR';
            if (!password) return setError("Please enter password");
        } else {
            if (!sapid || !password) return setError("Please enter SAP ID and Password");
        }

        setLoading(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sapid: payloadSapid, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");

            login({
                name: data.user.name,
                student_id: data.user.sapid,
                token: data.token,
                sapid: data.user.sapid,
                role: data.role || 'student'
            });

            gsap.to(".login-card", { scale: 0.9, opacity: 0, y: -50, duration: 0.5 });
            setTimeout(() => {
                if (data.role === 'director') navigate('/director', { replace: true });
                else if (data.role === 'admin') navigate('/admin/dashboard', { replace: true });
                else navigate('/student/' + data.user.sapid, { replace: true });
            }, 500);

        } catch (err) {
            console.error(err);
            setError(err.message || "Login failed. Check Credentials.");
            setLoading(false);
            gsap.to(".login-card", { x: [-5, 5, -5, 5, 0], duration: 0.4, ease: "none" });
        }
    }

    const toggleMode = () => {
        setLoginType(prev => prev === 'student' ? 'director' : 'student');
        setError(""); setSapid(""); setPassword("");
    };

    return (
        <div ref={containerRef} className="bg-white overflow-x-hidden font-sans text-slate-900">

            {/* HER0 SECTION */}
            <div className="relative min-h-screen w-full flex flex-col md:flex-row items-center justify-center p-6 md:p-20 bg-slate-50">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>

                {/* Left Content */}
                <div className="relative z-10 w-full md:w-1/2 space-y-8 mb-12 md:mb-0 md:pr-12">
                    <div className="hero-text">
                        {/* BIG LOGO */}
                        <img src={NMIMSLogo} alt="NMIMS" className="h-32 object-contain mb-8 drop-shadow-md" />
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight hero-text text-slate-900">
                        The Future of <br />
                        <span className="text-red-700">Student Success</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-lg hero-text font-medium leading-relaxed">
                        Your all-in-one portal for attendance, advanced analytics, and AI-powered career growth.
                    </p>
                    <div className="flex gap-4 pt-4 hero-text">
                        <span className="px-5 py-2.5 rounded-full bg-red-50 text-red-700 text-sm font-bold flex items-center gap-2 border border-red-100 shadow-sm">
                            <Bot size={18} /> AI Coach
                        </span>
                        <span className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 text-sm font-bold flex items-center gap-2 border border-slate-200 shadow-sm">
                            <Users size={18} /> Alumni Network
                        </span>
                    </div>
                </div>

                {/* Right Login Card */}
                <div className="relative z-10 w-full md:w-1/2 max-w-md">
                    <div className={`login-card bg-white border ${loginType === 'director' ? 'border-red-500' : 'border-slate-200'} shadow-2xl rounded-3xl p-8 md:p-10 relative`}>
                        {/* Decorative Red Line */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-600 rounded-t-3xl"></div>

                        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center mt-2">
                            {loginType === 'director' ? 'Director Portal' : 'Student Login'}
                        </h2>
                        <p className="text-center text-slate-500 text-sm mb-6">
                            Sign in with your University Credentials
                        </p>

                        <form onSubmit={handleLogin} className="space-y-5">
                            {loginType !== 'director' && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">SAP ID</label>
                                    <input
                                        type="text"
                                        value={sapid}
                                        onChange={(e) => setSapid(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                                        placeholder="Enter SAP ID"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 font-medium">
                                    <ShieldCheck size={16} /> {error}
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 hover:shadow-red-600/40">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                            </button>
                        </form>
                        <button onClick={toggleMode} className="w-full text-center text-xs text-slate-400 mt-6 hover:text-red-600 font-medium transition-colors">
                            Switch to {loginType === 'director' ? 'Student' : 'Director'} Login
                        </button>
                    </div>
                </div>
            </div>

            {/* STATS TICKER (Red Brand) */}
            <div className="bg-red-700 text-white py-12 relative z-20 shadow-inner">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
                    <div><h3 className="text-4xl font-bold">15k+</h3><p className="text-red-100 text-sm font-medium mt-1">Active Students</p></div>
                    <div><h3 className="text-4xl font-bold">98%</h3><p className="text-red-100 text-sm font-medium mt-1">Attendance Accuracy</p></div>
                    <div><h3 className="text-4xl font-bold">500+</h3><p className="text-red-100 text-sm font-medium mt-1">Faculty Members</p></div>
                    <div><h3 className="text-4xl font-bold">24/7</h3><p className="text-red-100 text-sm font-medium mt-1">System Uptime</p></div>
                </div>
            </div>

            {/* SHOWCASE: AI CAREER COACH */}
            <div className="bg-white py-24 border-b border-slate-100 showcase-section">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                    <div className="w-full md:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold uppercase tracking-wide mb-6 border border-red-100">
                            <Sparkles size={14} /> Powered by Gemini
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                            Your Personal <br />
                            <span className="text-red-700">Career Strategist.</span>
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Stop guessing your next step. Our AI Career Pilot analyzes your goals, identifies gaps, and creates a personalized daily roadmap to land your dream job.
                        </p>
                        <ul className="space-y-5 mb-8">
                            <li className="flex items-center gap-4 text-slate-800 font-bold p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-600 shadow-sm"><CheckCircle size={20} /></div>
                                24/7 Resume Reviews
                            </li>
                            <li className="flex items-center gap-4 text-slate-800 font-bold p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-600 shadow-sm"><CheckCircle size={20} /></div>
                                Smart Skill Gap Analysis
                            </li>
                        </ul>
                    </div>
                    <div className="w-full md:w-1/2">
                        <div className="relative rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 rotate-1 hover:rotate-0 transition-all duration-500">
                            {/* Mock Chat UI (Light Mode) */}
                            <div className="absolute -top-3 left-6 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold shadow-lg">Live Demo</div>
                            <div className="flex gap-4 mb-4 mt-2">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><Bot size={20} /></div>
                                <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none text-slate-700 text-sm font-medium max-w-[80%]">
                                    I see you're aiming for Google! Let's work on your Data Structures today. Here's a challenge. 🚀
                                </div>
                            </div>
                            <div className="flex gap-4 flex-row-reverse mb-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600"><User size={20} /></div>
                                <div className="bg-red-600 p-4 rounded-2xl rounded-tr-none text-white text-sm font-medium shadow-md shadow-red-500/20">
                                    Sure! What problem should I solve?
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><Bot size={20} /></div>
                                <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none text-slate-700 text-sm font-medium max-w-[80%]">
                                    Try "Inverting a Binary Tree". It's a classic interview question. I'll review your code in Python.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SHOWCASE: PROFESSIONAL NETWORK */}
            <div className="bg-slate-50 py-24 showcase-section border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6 flex flex-col-reverse md:flex-row items-center gap-16">
                    <div className="w-full md:w-1/2">
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-red-100 text-red-700 rounded-xl flex items-center justify-center"><Users size={24} /></div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900">Alumni Network</h4>
                                    <p className="text-slate-500 text-sm">Connect with verified graduates.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                                        <div className="flex-1">
                                            <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                                            <div className="h-3 w-20 bg-slate-100 rounded"></div>
                                        </div>
                                        <button className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-red-600 transition-colors">Connect</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 md:pl-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wide mb-6">
                            <Globe size={14} /> Global Community
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                            Connect. Verify. <br />
                            <span className="text-red-700">Succeed Together.</span>
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
                            Build a professional portfolio that speaks for itself. Connect with verified alumni, showcase your certifications, and get discovered by top recruiters.
                        </p>
                        <button onClick={() => window.scrollTo(0, 0)} className="bg-red-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-800 transition-all shadow-xl shadow-red-700/20 flex items-center gap-2">
                            Start Building Your Network <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="bg-white border-t border-slate-200 py-12 text-slate-500 text-sm">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <img src={NMIMSLogo} className="h-8 object-contain" alt="Logo" />
                        </div>
                        <p className="max-w-xs text-slate-600">
                            Empowering students with real-time data and career tools.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Platform</h4>
                        <ul className="space-y-2">
                            <li className="hover:text-red-600 cursor-pointer">Attendance</li>
                            <li className="hover:text-red-600 cursor-pointer">Analytics</li>
                            <li className="hover:text-red-600 cursor-pointer">Career Coach</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Support</h4>
                        <ul className="space-y-2">
                            <li className="hover:text-red-600 cursor-pointer">Help Center</li>
                            <li><Link to="/admin/login" className="hover:text-red-600 cursor-pointer">Admin Portal</Link></li>
                            <li className="hover:text-red-600 cursor-pointer">Privacy Policy</li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 text-center pt-8 border-t border-slate-100 text-slate-400">
                    &copy; 2026 NMIMS University. All rights reserved. • v2.0
                </div>
            </footer>

        </div>
    );
};

export default Landing;
