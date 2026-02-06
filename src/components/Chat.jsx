
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/Store';
import { useSocket } from '../context/SocketContext';
import { Send, Lock, MoreVertical, Phone, Video, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Chat = () => {
    const { user } = useStore();
    const socket = useSocket();
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

    // 1. Fetch Friends List
    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await fetch(`${API_URL}/network/my-network`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setFriends(data.friends || []);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        if (user?.token) fetchFriends();
    }, [user]);

    // 2. Fetch Chat History when friend selected
    useEffect(() => {
        if (!selectedFriend) return;
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_URL}/network/messages/${selectedFriend.student_id}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) setMessages(await res.json());
            } catch (err) { console.error(err); }
        };
        fetchHistory();
    }, [selectedFriend, user]);

    // 3. Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 4. Socket Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('new_message', (msg) => {
            // Only append if it belongs to current chat
            if (selectedFriend && (msg.sender_id === selectedFriend.student_id || msg.sender_id === user.student_id)) {
                setMessages(prev => [...prev, msg]);
            }
        });

        return () => socket.off('new_message');
    }, [socket, selectedFriend, user]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedFriend) return;

        // Optimistic UI
        const tempMsg = {
            id: Date.now(),
            sender_id: user.student_id,
            text: newMessage,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');

        try {
            await fetch(`${API_URL}/network/message`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver_id: selectedFriend.student_id,
                    text: tempMsg.text
                })
            });
        } catch (err) {
            console.error(err);
            // Revert on fail?
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] flex bg-[#F0F2F5] overflow-hidden">

            {/* Sidebar (Friends List) */}
            <div className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col ${selectedFriend ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search friends..."
                            className="w-full bg-slate-100 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? <div className="p-4 text-center text-slate-400">Loading...</div> : (
                        friends.map(friend => (
                            <div
                                key={friend.student_id}
                                onClick={() => setSelectedFriend(friend)}
                                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedFriend?.student_id === friend.student_id ? 'bg-blue-50/50' : ''}`}
                            >
                                <div className="relative">
                                    <img
                                        src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${friend.name}`}
                                        className="w-12 h-12 rounded-full bg-white border border-slate-100"
                                    />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">{friend.name}</h3>
                                    <p className="text-xs text-slate-500 truncate max-w-[150px]">{friend.dept || 'Student'}</p>
                                </div>
                            </div>
                        ))
                    )}
                    {friends.length === 0 && !loading && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            <p>No friends yet.</p>
                            <p className="mt-2 text-xs">Connect with students in Network to chat.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Window */}
            {selectedFriend ? (
                <div className="flex-1 flex flex-col h-full bg-[#EFEAE2]">
                    {/* Header */}
                    <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedFriend(null)}
                                className="md:hidden text-slate-600"
                            >
                                ←
                            </button>
                            <img
                                src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${selectedFriend.name}`}
                                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100"
                            />
                            <div>
                                <h3 className="font-bold text-slate-900 leading-tight">{selectedFriend.name}</h3>
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                            <div className="flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                                <Lock size={12} /> Encrypted
                            </div>
                            <Phone size={20} className="hover:text-blue-600 cursor-pointer transition-colors" />
                            <Video size={20} className="hover:text-blue-600 cursor-pointer transition-colors" />
                            <MoreVertical size={20} className="hover:text-slate-600 cursor-pointer" />
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        <div className="text-center text-xs text-slate-400 my-4 flex items-center justify-center gap-2">
                            <Lock size={12} /> Messages are end-to-end encrypted. No one outside of this chat, not even Antigravity, can read or listen to them.
                        </div>

                        {messages.map((msg, i) => {
                            const isMe = msg.sender_id === user.student_id;
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm relative group ${isMe ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'}`}>
                                        {msg.text}
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-green-800/60' : 'text-slate-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#F0F2F5] border-t border-slate-200">
                        <form onSubmit={sendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-white border-none rounded-full px-5 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="bg-emerald-600 text-white p-3 rounded-full hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:shadow-none transition-all"
                            >
                                <Send size={20} className={newMessage.trim() ? "translate-x-0.5" : ""} />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 hidden md:flex flex-col items-center justify-center text-slate-400 bg-[#F0F2F5] border-b-8 border-emerald-500">
                    <img src="https://img.freepik.com/free-vector/typing-concept-illustration_114360-3581.jpg" alt="Chat" className="w-1/2 opacity-80 mix-blend-multiply" />
                    <h2 className="text-2xl font-light text-slate-600 mt-4">Antigravity Web</h2>
                    <p className="mt-2 text-sm">Send and receive messages without keeping your phone online.</p>
                    <p className="mt-8 text-xs flex items-center gap-1 text-slate-400"><Lock size={12} /> End-to-end encrypted</p>
                </div>
            )}

        </div>
    );
};

export default Chat;
