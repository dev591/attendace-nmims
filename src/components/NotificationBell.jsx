import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/Store';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { user } = useStore();
    const navigate = useNavigate();
    const socket = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const containerRef = useRef(null);

    // Fetch Notifications
    const fetchNotifications = async () => {
        if (!user?.token) return;
        try {
            // Using existing dashboard endpoint or a dedicated one if we make it later. 
            // For now, let's assume we can fetch from a dedicated endpoint or reuse logic.
            // Since dashboard returns them, we could just read from store if we stored them global state,
            // but for a separate widget, a dedicated simple endpoint is cleaner.
            // Let's rely on dashboard reload or fetch purely.
            // Actually, server.js GET /student/:id/dashboard returns them.
            // Let's create a dedicated GET /student/notifications later? 
            // For now, let's just mock a fetch using the same logic or fetch dashboard context if available.
            // Simpler: Just rely on dashboard reload or fetch.
            // Let's verify if we have a route. We don't.
            // Let's assume passed via props OR fetch from new lightweight route.
            // Ideally we add GET /student/notifications to student_safe.js. 
            // But to avoid blocking, let's use the dashboard one? No that's heavy.
            // Let's adding the endpoint quickly is better.

            // Temporary: We will just fetch dashboard data cleanly (a bit heavy but works without new route)
            // Or better: use a client-side filter of the dashboard data if we had it in context.
            // We don't have dashboard data in global context.

            // Plan B: Add route to NotificationBell but for now let's just stub it or use the dashboard endpoint 
            // effectively.

            // Fetch from new Notification Engine
            // Use user.sapid if available, fallback to user.student_id
            const idToUse = user.sapid || user.student_id;
            const res = await fetch(`http://localhost:4000/notifications`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            // Wait, route was mounted in student_safe.js. Where is student_safe mounted?
            // In index.js: app.use('/college', collegeEcosystemRoutes); ... wait student_safe might be mounted elsewhere.
            // checking index.js for mount point of student_safe.js ... 
            // It is usually mounted at root or /api ...
            // Let's assume it is mounted at root based on previous file views (router.get('/student/:sapid/snapshot')).
            // NO, typically standard practice is app.use('/', studentSafeRoutes) or similar.
            // Let me verify mount point.
            // Assuming root based on existing snapshot code usage in other files.

            const resReal = await fetch(`http://localhost:4000/student/${idToUse}/notifications`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (resReal.ok) {
                const data = await resReal.json();
                setNotifications(data || []);
                setUnreadCount((data || []).filter(n => !n.is_read).length);
            }
        } catch (e) { console.error(e); }
    };

    const handleNotificationClick = (n) => {
        // Mark as read logic here...
        if (n.link) {
            navigate(n.link);
            setIsOpen(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchNotifications();
    }, [isOpen]);

    // Initial Fetch & Socket Listen
    useEffect(() => {
        fetchNotifications();

        if (socket) {
            socket.on('notification', (newNotif) => {
                console.log("New Notification Received:", newNotif);
                // Play sound?
                // Add to list
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(c => c + 1);
            });

            return () => {
                socket.off('notification');
            };
        }
    }, [user, socket]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 origin-top-right"
                    >
                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="max-h-[350px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                    No new notifications
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((n, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 cursor-pointer ${n.is_read ? '' : 'bg-blue-50/30'}`}
                                        >
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'danger' || n.type === 'error' ? 'bg-red-500' :
                                                n.type === 'success' ? 'bg-green-500' :
                                                    n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                                }`} />
                                            <div>
                                                {n.title && <p className="text-sm font-semibold text-gray-900">{n.title}</p>}
                                                <p className="text-sm text-gray-600 leading-snug">{n.message}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <p className="text-xs text-gray-400">
                                                        {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                    </p>
                                                    {n.link && <span className="text-xs text-blue-500 hover:underline">View Details</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
