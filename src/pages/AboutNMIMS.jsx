import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Target, Zap, Users, Library, GraduationCap, ArrowDown, MapPin, Quote, Building2, Globe } from 'lucide-react';

const AboutNMIMS = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Animation helper
    const fadeInUp = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div ref={containerRef} className="bg-white min-h-screen font-sans text-slate-900 overflow-x-hidden selection:bg-red-600 selection:text-white">

            {/* --- SECTION 1: HERO (Start of Journey) --- */}
            <section className="relative h-screen flex flex-col items-center justify-center bg-slate-900 text-white overflow-hidden">
                {/* Parallax Background Abstract */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-red-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
                    <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 animate-pulse-slow delay-1000"></div>
                </div>

                <div className="relative z-10 text-center max-w-5xl px-6">
                    <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                        <span className="inline-block py-1 px-4 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md">
                            Est. 2010 • Hyderabad Campus
                        </span>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
                            The Journey of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-amber-400">Excellence.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light mb-12">
                            90 Acres of innovation, leadership, and future-forward education. Welcome to NMIMS Jadcherla.
                        </p>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-12 flex flex-col items-center gap-4 cursor-pointer"
                    onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                >
                    <span className="text-xs uppercase tracking-widest text-slate-400">Begin the Journey</span>
                    <ArrowDown className="animate-bounce text-red-500" size={24} />
                </motion.div>
            </section>


            {/* --- SECTION 2: VISION & PHILOSOPHY --- */}
            <section className="min-h-screen py-32 flex items-center bg-white relative">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
                    >
                        <Target className="text-red-600 mb-8" size={64} />
                        <h2 className="text-5xl md:text-6xl font-bold mb-8 text-slate-900 leading-tight">
                            Vision Beyond <br /> Boundaries.
                        </h2>
                        <p className="text-xl text-slate-600 leading-relaxed mb-6">
                            Education isn't just about textbooks; it’s about transformation. At NMIMS Hyderabad, we are committed to nurturing global leaders who are socially responsible and technologically proficient.
                        </p>
                        <p className="text-xl text-slate-600 leading-relaxed border-l-4 border-red-600 pl-6 italic">
                            "To be a Center of Excellence in education & research, developing socially sensitive leaders."
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        {/* Abstract Representation of Vision */}
                        <div className="aspect-square rounded-full border-[20px] border-slate-50 relative flex items-center justify-center">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                <Globe className="text-slate-700 absolute opacity-20 -right-10 -bottom-10" size={300} />
                                <div className="text-center text-white z-10 p-8">
                                    <h3 className="text-4xl font-bold mb-2">2030</h3>
                                    <p className="text-slate-400 uppercase tracking-widest text-sm">Global Roadmap</p>
                                </div>
                            </div>
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600 rounded-full flex items-center justify-center shadow-xl animate-bounce-slow">
                                <Zap className="text-white" size={40} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* --- SECTION 3: CAMPUS STATS & SCALE --- */}
            <section className="py-32 bg-slate-50 border-y border-slate-200 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">The Scale of Ambition</h2>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                            A fully residential campus built to foster community and innovation.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Stat 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                            className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center group hover:bg-slate-900 hover:text-white transition-all duration-500"
                        >
                            <MapPin className="mx-auto mb-6 text-red-600 group-hover:text-red-400" size={48} />
                            <h3 className="text-7xl font-black mb-4">90</h3>
                            <p className="text-slate-500 font-medium uppercase tracking-widest text-sm group-hover:text-slate-400">Acres of Campus</p>
                        </motion.div>
                        {/* Stat 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                            className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center group hover:bg-red-600 hover:text-white transition-all duration-500"
                        >
                            <Users className="mx-auto mb-6 text-slate-900 group-hover:text-white" size={48} />
                            <h3 className="text-7xl font-black mb-4">1:12</h3>
                            <p className="text-slate-500 font-medium uppercase tracking-widest text-sm group-hover:text-red-100">Faculty Ratio</p>
                        </motion.div>
                        {/* Stat 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                            className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center group hover:bg-slate-900 hover:text-white transition-all duration-500"
                        >
                            <GraduationCap className="mx-auto mb-6 text-blue-600 group-hover:text-blue-400" size={48} />
                            <h3 className="text-7xl font-black mb-4">100%</h3>
                            <p className="text-slate-500 font-medium uppercase tracking-widest text-sm group-hover:text-slate-400">Placement Record</p>
                        </motion.div>
                    </div>
                </div>
            </section>


            {/* --- SECTION 4: LEADERSHIP MESSAGE --- */}
            <section className="min-h-[80vh] py-32 flex items-center justify-center">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
                        <Quote className="text-red-100 mx-auto mb-8" size={80} />
                        <h3 className="text-3xl md:text-5xl font-medium leading-snug text-slate-900 mb-12">
                            "We are not just building careers; we are shaping the character of the next generation. Integrity and Discipline are the cornerstones of our pedagogy."
                        </h3>
                        <div className="inline-flex items-center gap-4 bg-slate-50 px-8 py-4 rounded-full border border-slate-100">
                            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold">
                                DL
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-slate-900">Campus Leadership</div>
                                <div className="text-xs uppercase tracking-wider text-slate-500">NMIMS Hyderabad</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* --- SECTION 5: INFRASTRUCTURE --- */}
            <section className="py-32 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-start">
                        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <h2 className="text-4xl md:text-6xl font-bold mb-8">World Class <br /> Infrastructure.</h2>
                            <p className="text-xl text-slate-400 leading-relaxed mb-12">
                                We believe environment determines performance. Our infrastructure rivals global standards, providing students with the best tools to succeed.
                            </p>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                                        <Library size={20} />
                                    </div>
                                    <span className="text-xl font-bold">Digital Library & Research Center</span>
                                </div>
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <Zap size={20} />
                                    </div>
                                    <span className="text-xl font-bold">Bloomberg Finance Lab</span>
                                </div>
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-green-600 transition-colors">
                                        <Building2 size={20} />
                                    </div>
                                    <span className="text-xl font-bold">Technology Incubation Center</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                            className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-sm"
                        >
                            <div className="grid grid-cols-2 gap-4 h-96">
                                <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 flex flex-col justify-end">
                                    <span className="text-3xl font-bold">24/7</span>
                                    <span className="text-red-200 text-sm">WiFi Enabled</span>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-6 flex flex-col justify-end">
                                    <span className="text-3xl font-bold">Hostel</span>
                                    <span className="text-slate-300 text-sm">On-Campus Living</span>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-6 flex flex-col justify-end">
                                    <span className="text-3xl font-bold">Sports</span>
                                    <span className="text-slate-300 text-sm">Complex & Gym</span>
                                </div>
                                <div className="bg-white rounded-2xl p-6 flex flex-col justify-end">
                                    <span className="text-3xl font-bold text-slate-900">Cafeteria</span>
                                    <span className="text-slate-500 text-sm">Multi-cuisine</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>


            {/* --- SECTION 6: TIMELINE (The End of Journey) --- */}
            <section className="py-32 bg-white">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-slate-900">A Decade of Milestones</h2>
                    </motion.div>

                    <div className="relative border-l-2 border-slate-200 pl-8 space-y-16 ml-4 md:ml-0">
                        {/* 2010 */}
                        <div className="relative">
                            <span className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-red-600 ring-4 ring-white"></span>
                            <h4 className="text-2xl font-bold text-slate-900 mb-2">2010</h4>
                            <p className="text-lg text-slate-600">Inception of NMIMS Hyderabad in Tarnaka. A small step towards a big vision.</p>
                        </div>
                        {/* 2018 */}
                        <div className="relative">
                            <span className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-slate-300 ring-4 ring-white"></span>
                            <h4 className="text-2xl font-bold text-slate-900 mb-2">2018</h4>
                            <p className="text-lg text-slate-600">The Big Move. Shifted to the massive 90-acre Jadcherla Campus, unlocking full residential potential.</p>
                        </div>
                        {/* 2022 */}
                        <div className="relative">
                            <span className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-slate-300 ring-4 ring-white"></span>
                            <h4 className="text-2xl font-bold text-slate-900 mb-2">2022</h4>
                            <p className="text-lg text-slate-600">AMBA Accreditation. Recognized globally for excellence in management education.</p>
                        </div>
                        {/* 2026 */}
                        <div className="relative">
                            <span className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-slate-900 ring-4 ring-white animate-pulse"></span>
                            <h4 className="text-2xl font-bold text-slate-900 mb-2">2026</h4>
                            <p className="text-lg text-slate-600">Digital Campus 2.0. Launch of the next-gen AI-powered student ecosystem (You are here).</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default AboutNMIMS;
