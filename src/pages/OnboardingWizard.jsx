
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Rocket, Briefcase, Code, Sparkles } from 'lucide-react';
import { useStore } from '../context/Store';
import { useNavigate } from 'react-router-dom';

const OnboardingWizard = () => {
    const { user, login } = useStore(); // Need login to update user state locally if needed
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        dream_company: '',
        career_goal: '',
        study_hours: '1-2 hours',
        linkedin_url: '',
        github_url: ''
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/student/onboarding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to save profile");

            // Navigate to Portfolio or Coach
            // ANTI-GRAVITY FIX: Navigate to correct dynamic route
            navigate(`/student/${user.id}/portfolio`);

        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const variants = {
        enter: { x: 100, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -100, opacity: 0 }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-100 flex flex-col md:flex-row relative min-h-[500px]">

                {/* Left Panel - Visual */}
                <div className="w-full md:w-1/3 bg-black text-white p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="z-10">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
                            <Rocket size={20} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold leading-tight">Career Copilot</h2>
                        <p className="mt-2 text-white/60 text-sm">Let's set your north star.</p>
                    </div>

                    <div className="z-10 mt-auto">
                        <div className="flex gap-2 mb-8">
                            {[0, 1, 2].map(i => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-white' : 'bg-white/20'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Gradient Blob */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-600 rounded-full blur-3xl opacity-50 mix-blend-screen animate-pulse" />
                </div>

                {/* Right Panel - Form */}
                <div className="w-full md:w-2/3 p-8 md:p-12 relative">
                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.div
                                key="step0"
                                variants={variants} initial="enter" animate="center" exit="exit"
                                className="h-full flex flex-col"
                            >
                                <h3 className="text-2xl font-semibold text-neutral-900 mb-6">What's your dream?</h3>

                                <label className="block mb-4">
                                    <span className="text-sm font-medium text-neutral-500 mb-1 block">Dream Company</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Google, McKinsey, My Own Startup"
                                        className="w-full p-4 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-medium"
                                        value={formData.dream_company}
                                        onChange={e => setFormData({ ...formData, dream_company: e.target.value })}
                                    />
                                </label>

                                <label className="block mb-4">
                                    <span className="text-sm font-medium text-neutral-500 mb-1 block">Career Role</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Product Manager, AI Researcher"
                                        className="w-full p-4 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-medium"
                                        value={formData.career_goal}
                                        onChange={e => setFormData({ ...formData, career_goal: e.target.value })}
                                    />
                                </label>

                                <div className="mt-auto flex justify-end">
                                    <button onClick={handleNext} disabled={!formData.dream_company} className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100">
                                        Next <ArrowRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={variants} initial="enter" animate="center" exit="exit"
                                className="h-full flex flex-col"
                            >
                                <h3 className="text-2xl font-semibold text-neutral-900 mb-6">Commitment Level</h3>

                                <div className="space-y-3">
                                    {['30 mins/day', '1-2 hours/day', '3+ hours/day (Hardcore)'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setFormData({ ...formData, study_hours: opt })}
                                            className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${formData.study_hours === opt ? 'border-black bg-neutral-50 ring-1 ring-black' : 'border-neutral-200 hover:border-neutral-300'}`}
                                        >
                                            <span className="font-medium text-neutral-700">{opt}</span>
                                            {formData.study_hours === opt && <Check size={18} className="text-black" />}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-auto flex justify-between">
                                    <button onClick={handleBack} className="text-neutral-500 hover:text-neutral-900 font-medium">Back</button>
                                    <button onClick={handleNext} className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-transform">
                                        Next <ArrowRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={variants} initial="enter" animate="center" exit="exit"
                                className="h-full flex flex-col"
                            >
                                <h3 className="text-2xl font-semibold text-neutral-900 mb-6">Social Proof</h3>

                                <label className="block mb-4">
                                    <span className="text-sm font-medium text-neutral-500 mb-1 block">LinkedIn URL</span>
                                    <div className="relative">
                                        <Briefcase size={18} className="absolute left-4 top-4 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="linkedin.com/in/you"
                                            className="w-full pl-12 p-4 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-medium"
                                            value={formData.linkedin_url}
                                            onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                                        />
                                    </div>
                                </label>

                                <label className="block mb-4">
                                    <span className="text-sm font-medium text-neutral-500 mb-1 block">GitHub / Portfolio URL</span>
                                    <div className="relative">
                                        <Code size={18} className="absolute left-4 top-4 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="github.com/you"
                                            className="w-full pl-12 p-4 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-medium"
                                            value={formData.github_url}
                                            onChange={e => setFormData({ ...formData, github_url: e.target.value })}
                                        />
                                    </div>
                                </label>

                                <div className="mt-auto flex justify-between">
                                    <button onClick={handleBack} className="text-neutral-500 hover:text-neutral-900 font-medium">Back</button>
                                    <button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-medium hover:scale-105 transition-transform disabled:opacity-50">
                                        {isLoading ? <Sparkles size={18} className="animate-spin" /> : "Launch Copilot"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
