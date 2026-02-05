import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MoreVertical, CheckCircle, Clock } from 'lucide-react';
import { useStore } from '../context/Store';
import config from '../utils/config';

const ChatWindow = ({ friend, onClose }) => {
    const { user } = useStore();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);
    const API_URL = config.API_URL;

    // Poll for messages every 2 seconds
    useEffect(() => {
        if (!friend) return;

        fetchMessages();
        const interval = setInterval(fetchMessages, 2000); // Live Polling
        return () => clearInterval(interval);
    }, [friend]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${API_URL}/network/messages/${friend.student_id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) { console.error(err); }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText(""); // Optimistic clear

        try {
            // Optimistic UI Update
            setMessages(prev => [...prev, {
                sender_id: user.currentUser.student_id,
                text: text,
                created_at: new Date().toISOString(),
                is_read: false
            }]);

            const res = await fetch(`${API_URL}/network/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    receiver_id: friend.student_id,
                    text: text
                })
            });

            if (!res.ok) fetchMessages(); // Revert/Correct on failure
        } catch (err) {
            console.error("Send failed", err);
        }
    };

    if (!friend) return null;

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${friend.name}`}
                            className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-tight">{friend.name}</h3>
                        <span className="text-xs text-slate-400">Online</span>
                    </div>
                </div>
                <div className="flex gap-2 text-slate-400">
                    <button onClick={onClose} className="hover:text-white transition-colors"><X size={20} /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F0F2F5]">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 text-xs mt-10">
                        Start a conversation with {friend.name.split(' ')[0]}
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isMe = msg.sender_id === user.currentUser.student_id;
                    return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm relative ${isMe
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white text-slate-800 rounded-bl-none'
                                }`}>
                                {msg.text}
                                <div className={`text-[10px] mt-1 text-right opacity-70 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:scale-95"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
