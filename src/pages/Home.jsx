
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, User, GraduationCap, ArrowRight, BookOpen, BarChart2, CheckCircle, Globe, Award, Calendar, Loader2 } from 'lucide-react';
import NMIMSLogo from '../assets/nmims_logo.png';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
    const mainRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    // FETCH LIVE EVENTS
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';
                const res = await fetch(`${API_URL}/events/public`);
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                }
            } catch (err) {
                console.error("Failed to fetch public events", err);
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchEvents();
    }, []);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            const tl = gsap.timeline({ delay: 0.2 });
            tl.from(".hero-logo", { y: 50, opacity: 0, duration: 1, ease: "power3.out" })
                .from(".hero-text", { y: 30, opacity: 0, stagger: 0.2, duration: 0.8 }, "-=0.5")
                .from(".login-btn", { y: 20, opacity: 0, stagger: 0.1, duration: 0.6 }, "-=0.4");

            gsap.utils.toArray('.fade-in-section').forEach(section => {
                gsap.from(section, {
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%",
                    },
                    y: 40,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power2.out"
                });
            });
        }, mainRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={mainRef} className="bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-red-600 selection:text-white">

            {/* FIXED TOP NAVBAR */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 md:px-8 flex justify-between items-center transition-all duration-300">
                <div className="flex items-center gap-3">
                    <img src={NMIMSLogo} alt="Logo" className="h-8 object-contain" />
                    <span className="hidden md:block text-xs font-bold uppercase tracking-widest text-slate-500 border-l border-slate-300 pl-3">Hyderabad Campus</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login?mode=director" className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider hidden md:block">Director Login</Link>
                    <Link to="/login" className="bg-red-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 hover:shadow-red-600/40 transition-all flex items-center gap-2">
                        <User size={16} /> Student Login
                    </Link>
                </div>
            </nav>

            {/* HERO SECTION */}
            <div className="relative min-h-[90vh] flex flex-col justify-center items-center px-6 pt-32 pb-20 bg-slate-50">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 text-center max-w-5xl mx-auto">
                    <img src={NMIMSLogo} alt="NMIMS" className="hero-logo h-32 md:h-40 mx-auto object-contain drop-shadow-lg mb-10" />

                    <h1 className="hero-text text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
                        NMIMS <br />
                        <span className="text-red-700">Hyderabad Jadcherla</span>
                    </h1>
                    <p className="hero-text text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium mb-12">
                        Welcome to the official digital campus. <br />
                        Excellence in Education since 2010.
                    </p>

                    {/* BIG LOGIN BUTTONS */}
                    <div className="flex flex-col md:flex-row gap-6 justify-center w-full max-w-4xl mx-auto">

                        {/* 1. STUDENT */}
                        <Link to="/login" className="login-btn group relative flex-1 bg-white border-2 border-slate-200 hover:border-red-600 rounded-2xl p-6 text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                <GraduationCap size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Student Login</h3>
                            <p className="text-slate-500 text-sm mb-4">Access Dashboard, Attendance</p>
                            <span className="text-red-600 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                Login <ArrowRight size={16} />
                            </span>
                        </Link>

                        {/* 2. DIRECTOR */}
                        <Link to="/login?mode=director" className="login-btn group relative flex-1 bg-white border-2 border-slate-200 hover:border-slate-800 rounded-2xl p-6 text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                                <BarChart2 size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Director Access</h3>
                            <p className="text-slate-500 text-sm mb-4">Analytics, Approvals</p>
                            <span className="text-slate-700 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                Console <ArrowRight size={16} />
                            </span>
                        </Link>

                        {/* 3. FACULTY / ADMIN */}
                        <Link to="/admin/login" className="login-btn group relative flex-1 bg-white border-2 border-slate-200 hover:border-blue-600 rounded-2xl p-6 text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Admin Portal</h3>
                            <p className="text-slate-500 text-sm mb-4">Configuration, Management</p>
                            <span className="text-blue-600 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                Login <ArrowRight size={16} />
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Scroll Hint */}
                <div className="absolute bottom-8 animate-bounce text-slate-400 flex flex-col items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer">
                    Scroll to Explore
                    <div className="w-px h-8 bg-slate-300"></div>
                </div>
            </div>

            {/* STATS BAR */}
            <div className="bg-red-700 text-white py-16 relative z-10 shadow-inner fade-in-section">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
                    <div><h3 className="text-4xl md:text-5xl font-black">2010</h3><p className="text-red-100 font-medium mt-2">Established</p></div>
                    <div><h3 className="text-4xl md:text-5xl font-black">12+</h3><p className="text-red-100 font-medium mt-2">Programs Offered</p></div>
                    <div><h3 className="text-4xl md:text-5xl font-black">100%</h3><p className="text-red-100 font-medium mt-2">Placement Support</p></div>
                    <div><h3 className="text-4xl md:text-5xl font-black">A+</h3><p className="text-red-100 font-medium mt-2">NAAC Grade</p></div>
                </div>
            </div>

            {/* ABOUT / VISION SECTION */}
            <div className="py-24 bg-white fade-in-section">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-block px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6">About NMIMS Jadcherla</div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                            Redefining Education <br /> for the Digital Age.
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed mb-8">
                            Located in the rapidly growing hub of Hyderabad, our Jadcherla campus offers state-of-the-art infrastructure and a curriculum designed for the future. The new **Digital Campus 2.0** ensures every student, faculty, and director is connected in real-time.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-800 font-bold"><CheckCircle className="text-red-600" size={20} /> Tier-1 Infrastructure</li>
                            <li className="flex items-center gap-3 text-slate-800 font-bold"><CheckCircle className="text-red-600" size={20} /> Industry-Integrated Curriculum</li>
                            <li className="flex items-center gap-3 text-slate-800 font-bold"><CheckCircle className="text-red-600" size={20} /> 100% Digital Governance</li>
                        </ul>
                    </div>
                    <div className="relative">
                        {/* Abstract Visual Representation */}
                        <div className="aspect-square bg-slate-50 rounded-3xl border border-slate-100 p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                            <div className="grid grid-cols-2 gap-4 h-full">
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-end">
                                    <Globe className="text-red-600 mb-4" size={32} />
                                    <span className="font-bold text-slate-900">Global Reach</span>
                                </div>
                                <div className="bg-red-600 rounded-2xl shadow-lg p-6 flex flex-col justify-end text-white mt-8">
                                    <Award className="mb-4" size={32} />
                                    <span className="font-bold">Excellence</span>
                                </div>
                                <div className="bg-slate-900 rounded-2xl shadow-lg p-6 flex flex-col justify-end text-white">
                                    <BookOpen className="mb-4" size={32} />
                                    <span className="font-bold">Research</span>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-end mt-8">
                                    <User className="text-slate-900 mb-4" size={32} />
                                    <span className="font-bold text-slate-900">Leadership</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE CAMPUS HAPPENINGS */}
            <div className="py-24 bg-slate-50 border-t border-slate-200 fade-in-section">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">Campus Happenings</h2>
                            <p className="text-slate-500 mt-2">Latest updates and events from the university (Live).</p>
                        </div>
                        {/* This button could link to a public events page if one existed */}
                    </div>

                    {loadingEvents ? (
                        <div className="flex justify-center py-12 text-slate-400">
                            <Loader2 className="animate-spin mr-2" /> Loading Events...
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                            <p className="text-slate-400 font-medium">No upcoming public events announced.</p>
                            <p className="text-xs text-slate-300 mt-1">Check back later or login for student-specific events.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-8">
                            {events.map((event) => (
                                <div key={event.event_id} className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl transition-all group cursor-pointer flex flex-col h-full">
                                    <div className="text-xs font-bold text-red-600 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                        <Calendar size={14} /> {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
                                        {event.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                                        {event.description}
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-400">{event.school}</span>
                                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400 group-hover:text-slate-900 transition-colors">Details &rarr;</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER */}
            <footer className="bg-slate-900 text-slate-400 py-16 text-sm">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <img src={NMIMSLogo} alt="NMIMS" className="h-10 object-contain mb-6 brightness-0 invert opacity-80" />
                        <p className="max-w-sm leading-relaxed opacity-80">
                            SVKM's NMIMS Hyderabad Jadcherla. <br />
                            We are committed to providing world-class education.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider">Quick Links</h4>
                        <ul className="space-y-3">
                            <li className="hover:text-white cursor-pointer transition-colors">Admissions</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Examinations</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Library</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Alumni</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider">Contact</h4>
                        <ul className="space-y-3">
                            <li>Green Industrial Park, Polepally SEZ, KSIIC, Mahbubnagar, Jadcherla, Telangana 509301</li>
                            <li>040 - 23000200</li>
                            <li>enquiry@nmims.edu</li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-slate-800 text-center opacity-60">
                    © {new Date().getFullYear()} SVKM's NMIMS Hyderabad. All rights reserved. <span className="mx-2">|</span> Developed by <strong>Dev Chalana</strong>
                </div>
            </footer>
        </div>
    );
};

export default Home;
