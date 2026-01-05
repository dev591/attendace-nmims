import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/Store';
import { ShieldCheck, User, Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Landing = () => {
    const navigate = useNavigate();
    const { login } = useStore();
    const [loading, setLoading] = useState(false);
    const [sapid, setSapid] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isShaking, setIsShaking] = useState(false);

    // Floating Label Helpers
    const [focusedField, setFocusedField] = useState(null);
    const isFieldActive = (val) => val && val.length > 0;

    async function handleLogin(e) {
        if (e) e.preventDefault();
        setError("");
        setIsShaking(false);

        if (!sapid || !password) {
            setError("Please enter both SAP ID and Password");
            setIsShaking(true);
            return;
        }

        setLoading(true);

        try {
            localStorage.removeItem("token");
            localStorage.removeItem("student_id");
            localStorage.removeItem("user_name");
        } catch (e) { }

        const body = { sapid, password };

        try {
            console.log("[FRONTEND DEBUG] Attempting login with", body.sapid);
            const res = await fetch("http://localhost:4000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            let data;
            try {
                data = await res.json();
            } catch (err) {
                setError("Invalid server response");
                setLoading(false);
                setIsShaking(true);
                return;
            }

            console.log("[FRONTEND DEBUG] login response:", res.status, data);

            if (!res.ok) {
                const msg = data && data.error ? data.error : `Login failed (status ${res.status})`;
                setError(msg);
                setLoading(false);
                setIsShaking(true);
                return;
            }

            if (data.error || !data.token) {
                setError(data.error || "Login failed: no token returned");
                setLoading(false);
                setIsShaking(true);
                return;
            }

            // Success Animation wait? No, instant feel is better, maybe tiny delay for pure aesthetics
            await new Promise(r => setTimeout(r, 600)); // Just 600ms to show the success state

            try {
                login({
                    token: data.token,
                    student_id: data.student_id,
                    name: data.name
                });
                navigate(`/student/${data.student_id}`);
            } catch (navErr) {
                console.error("Navigation/State Error:", navErr);
                alert("Critical Error during redirect: " + navErr.message);
            }
        } catch (err) {
            console.error("Login fetch error", err);
            setError("Connection failed. Is backend running?");
            setLoading(false);
            setIsShaking(true);
        }
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-red-50/50 rounded-full blur-[100px] opacity-60 animate-pulse-slow"></div>
                <div className="absolute top-[40%] -right-[10%] w-[50vw] h-[50vw] bg-gray-100/50 rounded-full blur-[80px] opacity-40"></div>
                <div className="absolute bottom-0 w-full h-[50vh] bg-gradient-to-t from-white via-transparent to-transparent"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[420px] relative z-10 perspective-1000"
            >
                {/* Shake Wrapper */}
                <motion.div
                    animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 p-8 md:p-10 relative overflow-hidden ring-1 ring-black/5"
                >
                    {/* Top Accent Gradient */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-500"></div>

                    {/* BRANDING */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ rotate: -10, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="w-16 h-16 bg-gradient-to-br from-[#D21F3C] to-[#B01830] text-white rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-5 shadow-lg shadow-red-200"
                        >
                            N
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Portal</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Access your attendance, insights & academic progress.</p>
                    </div>

                    {/* FORM */}
                    <div className="space-y-6">
                        {/* SAPID INPUT */}
                        <div className="relative group">
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'sapid' ? 'text-nmims-primary' : 'text-gray-400'}`}>
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                name="sapid"
                                className={`
                                    w-full pl-12 pr-4 py-4 bg-gray-50/50 border rounded-xl outline-none transition-all duration-300 font-medium
                                    ${focusedField === 'sapid' ? 'border-nmims-primary ring-2 ring-red-50 bg-white' : 'border-gray-200 hover:border-gray-300'}
                                    ${error ? 'border-red-300 bg-red-50/10' : ''}
                                `}
                                value={sapid}
                                onChange={e => setSapid(e.target.value)}
                                onFocus={() => setFocusedField('sapid')}
                                onBlur={() => setFocusedField(null)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            />
                            <label className={`
                                absolute left-12 transition-all duration-300 pointer-events-none
                                ${focusedField === 'sapid' || isFieldActive(sapid) ? '-top-2.5 text-xs bg-white px-1 text-nmims-primary font-bold' : 'top-4 text-gray-400 font-medium'}
                             `}>
                                SAP ID / Roll No
                            </label>
                        </div>

                        {/* PASSWORD INPUT */}
                        <div className="relative group">
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'password' ? 'text-nmims-primary' : 'text-gray-400'}`}>
                                <Lock size={20} />
                            </div>
                            <input
                                type="password"
                                name="password"
                                className={`
                                    w-full pl-12 pr-4 py-4 bg-gray-50/50 border rounded-xl outline-none transition-all duration-300 font-medium
                                    ${focusedField === 'password' ? 'border-nmims-primary ring-2 ring-red-50 bg-white' : 'border-gray-200 hover:border-gray-300'}
                                    ${error ? 'border-red-300 bg-red-50/10' : ''}
                                `}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            />
                            <label className={`
                                absolute left-12 transition-all duration-300 pointer-events-none
                                ${focusedField === 'password' || isFieldActive(password) ? '-top-2.5 text-xs bg-white px-1 text-nmims-primary font-bold' : 'top-4 text-gray-400 font-medium'}
                             `}>
                                Password
                            </label>
                        </div>
                    </div>

                    {/* ERROR MSG */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* SUBMIT BUTTON */}
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 15px 30px -10px rgba(220, 38, 38, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full mt-8 bg-gradient-to-br from-[#D21F3C] to-[#B01830] text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-red-200/50 flex items-center justify-center gap-2.5 group relative overflow-hidden transition-all disabled:opacity-80 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" size={20} /> Verifying...</>
                        ) : (
                            <>Secure Login <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                        )}
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:animate-shine" />
                    </motion.button>

                    {/* FOOTER */}
                    <div className="mt-8 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium bg-gray-50/50 py-2 rounded-lg border border-gray-100/50">
                            <ShieldCheck size={14} className="text-green-600" />
                            Synced securely with NMIMS academic systems
                        </div>

                        <Link to="/admin/login" className="mt-5 inline-block text-xs font-semibold text-gray-400 hover:text-nmims-primary transition-colors">
                            Admin Access
                        </Link>
                    </div>

                </motion.div>

                <p className="text-center text-xs text-gray-400 mt-6 font-medium tracking-wide">
                    © 2025 NMIMS University. All rights reserved.
                </p>

            </motion.div>
        </div>
    );
};

export default Landing;

