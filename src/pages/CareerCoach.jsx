
import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle, Circle, RefreshCw, Bot, User, Sparkles, Lock } from 'lucide-react';

import { useStore } from '../context/Store';
import { useNavigate } from 'react-router-dom';

import config from '../utils/config';

const API_URL = config.API_URL;

const CareerCoach = ({ compact = false }) => {
    const { user } = useStore();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { role: 'ai', text: `Hi ${user?.name || 'there'}! I'm your AI Career Coach. I see you're aiming for ${user?.career_goal || 'success'}. How can I help you prepare today?` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [generatingTasks, setGeneratingTasks] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    // Fetch Tasks on Load
    useEffect(() => {
        if (user) fetchTasks();
    }, [user]);

    // Safety Check
    if (!user) return <div className="p-4 text-center text-slate-400">Loading AI Coach...</div>;

    const fetchTasks = async () => {
        try {
            const res = await fetch(`${API_URL}/ai/tasks`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (e) { console.error(e); }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const newMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    message: input,
                    context: {
                        career_goal: user.career_goal,
                        dream_company: user.dream_company,
                        // If we had full context here we'd pass it, but backend can fetch too
                        // Passing minimal context for now
                    }
                })
            });

            const data = await res.json();

            if (res.status === 429) {
                setMessages(prev => [...prev, { role: 'ai', text: "🛑 Daily AI limit reached. You have used your 20 credits for today. See you tomorrow!", error: true }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTasks = async () => {
        setGeneratingTasks(true);
        try {
            const res = await fetch(`${API_URL}/ai/generate-tasks`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchTasks();
            } else if (data.message) {
                alert(data.message); // "Already generated"
            }
        } catch (e) {
            console.error(e);
        } finally {
            setGeneratingTasks(false);
        }
    };

    return (
        <div className={`flex flex-col ${!compact ? 'md:flex-row h-[85vh] max-w-7xl mx-auto p-4 md:p-8 gap-6' : 'h-[600px] gap-2'}`}>

            {/* LEFT: Daily Quests (Gamification) */}
            {!compact && (
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                    <Sparkles className="text-amber-500" size={20} /> Daily Quests
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">AI-generated for {user.career_goal || 'you'}</p>
                            </div>
                            <button
                                onClick={handleGenerateTasks}
                                disabled={generatingTasks || tasks.length > 0}
                                className={`p-2 rounded-full transition-all ${tasks.length > 0 ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                title="Generate New Tasks"
                            >
                                <RefreshCw size={18} className={generatingTasks ? "animate-spin" : ""} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-4">
                            {tasks.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <p>No active quests.</p>
                                    <button
                                        onClick={handleGenerateTasks}
                                        className="mt-4 text-sm text-blue-600 font-medium hover:underline"
                                    >
                                        Ask AI to generate Plan
                                    </button>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <div key={task.id} className="group flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                                        <button className="mt-0.5 text-slate-300 hover:text-green-500 transition-colors">
                                            {task.is_completed ? <CheckCircle className="text-green-500" size={20} /> : <Circle size={20} />}
                                        </button>
                                        <div>
                                            <p className={`text-sm font-medium ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                {task.task_text}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${task.type === 'code' ? 'bg-indigo-50 text-indigo-600' :
                                                    task.type === 'learn' ? 'bg-emerald-50 text-emerald-600' :
                                                        'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {task.type}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">+ {task.xp_reward} XP</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* RIGHT: Chat Interface */}
            <div className={`flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${!compact ? 'w-full md:w-2/3' : 'w-full h-full'}`}>
                {/* Chat Header */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Career Copilot</h3>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                Online • Powered by Gemini
                            </p>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                        Credits: 20/day
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-white border border-slate-200 text-purple-600'
                                }`}>
                                {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                            </div>

                            <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                                } ${msg.error ? 'border-red-200 bg-red-50 text-red-600' : ''}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                <Bot size={16} className="text-slate-400 animate-pulse" />
                            </div>
                            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask for roadmap, resume tips, or mock interview..."
                            className="w-full pl-5 pr-14 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-3">
                        AI can make mistakes. Please verify critical career advice.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CareerCoach;
