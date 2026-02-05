
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, Plus, Image as ImageIcon, CheckCircle, Award, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const SocialFeed = () => {
    const { user } = useStore();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

    const fetchFeed = async () => {
        try {
            const res = await fetch(`${API_URL}/social/feed`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) setPosts(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (user?.token) fetchFeed(); }, [user]);

    const handleLike = async (postId) => {
        // Optimistic UI
        setPosts(prev => prev.map(p =>
            p.post_id === postId
                ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 }
                : p
        ));

        try {
            await fetch(`${API_URL}/social/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId })
            });
        } catch (err) { console.error(err); fetchFeed(); } // Revert on error
    };

    const handlePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;
        setIsPosting(true);

        try {
            const res = await fetch(`${API_URL}/social/post`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newPost, image_url: null }) // TODO: Add Image Upload
            });

            if (res.ok) {
                setNewPost('');
                fetchFeed();
            }
        } catch (err) { console.error(err); }
        finally { setIsPosting(false); }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] p-4 lg:p-8 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Left Sidebar (Profile Snippet) */}
                <div className="hidden lg:block space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-24">
                        <div className="text-center">
                            <img src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${user.name}`} alt="Me" className="w-20 h-20 rounded-full mx-auto mb-3 bg-slate-50" />
                            <h3 className="font-bold text-lg text-slate-900">{user.name}</h3>
                            <p className="text-sm text-slate-500 mb-4">{user.program} • {user.year}nd Year</p>

                            <div className="flex justify-center gap-4 text-xs font-medium text-slate-600 border-t border-slate-100 pt-4">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">0</div>
                                    <div>Posts</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">0</div>
                                    <div>Following</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Create Post */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <form onSubmit={handlePost}>
                            <textarea
                                value={newPost}
                                onChange={e => setNewPost(e.target.value)}
                                placeholder="Share your latest achievement or project..."
                                className="w-full bg-slate-50 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none min-h-[80px]"
                            />
                            <div className="flex justify-between items-center mt-3">
                                <button type="button" className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-blue-50">
                                    <ImageIcon size={20} />
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newPost.trim() || isPosting}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    {isPosting ? 'Posting...' : <><Send size={16} /> Post</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Posts List */}
                    {loading ? (
                        <div className="py-12 text-center text-slate-400 animate-pulse">Loading feed...</div>
                    ) : (
                        posts.map(post => (
                            <motion.div
                                key={post.post_id}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                            >
                                {/* Header */}
                                <div className="p-4 flex items-center justify-between border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <img src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${post.author_name}`} className="w-10 h-10 rounded-full bg-slate-50" alt="" />
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">{post.author_name}</h4>
                                            <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button className="text-slate-300 hover:text-slate-500">•••</button>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                                    {post.image_url && (
                                        <img src={post.image_url} alt="Post" className="mt-4 rounded-lg w-full object-cover max-h-96" />
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-6">
                                    <button
                                        onClick={() => handleLike(post.post_id)}
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.is_liked ? 'text-red-500' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Heart size={18} fill={post.is_liked ? "currentColor" : "none"} />
                                        {post.likes_count}
                                    </button>
                                    <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
                                        <MessageCircle size={18} />
                                        Comment
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}

                    {!loading && posts.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <TrendingUp size={48} className="mx-auto mb-4 text-slate-200" />
                            <p>No posts yet. Be the first to share!</p>
                        </div>
                    )}

                </div>

                {/* Right Sidebar (Trending/Suggested) */}
                <div className="hidden lg:block space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-24">
                        <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Trending Achievements</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg"><Award size={16} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Hackathon Winner</p>
                                    <p className="text-xs text-slate-500">3 students awarded today</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><CheckCircle size={16} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Certified Java Dev</p>
                                    <p className="text-xs text-slate-500">Rahul just completed this</p>
                                </div>
                            </div>
                        </div>
                        <Link to="/network" className="block mt-6 text-center text-xs font-bold text-blue-600 hover:underline">
                            View All Network
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SocialFeed;
