/* ADDED BY ANTI-GRAVITY */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { useStore } from '../context/Store';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useStore(); // Access global store

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('http://localhost:4000/auth/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();

            if (res.ok) {
                // Correctly Login to Store
                login({
                    name: "System Admin",
                    sapid: "ADMIN",
                    role: "admin",
                    token: data.token
                });
                navigate('/admin/dashboard');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Connection failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-xl border-t-4 border-t-nmims-primary">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-nmims-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield size={32} className="text-nmims-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                        <p className="text-sm text-gray-500 mt-1">Authorized Personnel Only</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                                Access Key
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nmims-primary focus:border-nmims-primary transition-all outline-none"
                                    placeholder="Enter Admin Password"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-shake">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <Button variant="primary" className="w-full justify-center py-3 text-base">
                            Enter Dashboard
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <a href="/" className="text-xs text-gray-400 hover:text-gray-600">
                            ← Back to Student Login
                        </a>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminLogin;
