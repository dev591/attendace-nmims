
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { useStore } from '../context/Store';

const AppealModal = ({ isOpen, onClose }) => {
    const { user } = useStore();
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [type, setType] = useState('Medical');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successId, setSuccessId] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file || !description) {
            setError("Please complete all fields and upload proof.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('proof', file);
        formData.append('type', type);
        formData.append('description', description);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/student/appeal', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}` // Multipart handled auto by fetch
                },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            setSuccessId(data.appeal_id);
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative m-4">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>

                    {step === 1 ? (
                        <>
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-6">
                                Request Condonation
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reason Type</label>
                                    <select
                                        value={type} onChange={(e) => setType(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                    >
                                        <option value="Medical">Medical Emergency</option>
                                        <option value="Family">Family Function/Emergency</option>
                                        <option value="Competition">External Competition (Sports/Tech)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                    <textarea
                                        value={description} onChange={(e) => setDescription(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white h-24 resize-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="Explain your case briefly..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Upload Proof (Review Required)</label>
                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            accept="image/*,.pdf"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center">
                                            {file ? (
                                                <FileText className="text-indigo-600 mb-2" size={32} />
                                            ) : (
                                                <Upload className="text-slate-400 mb-2" size={32} />
                                            )}
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                {file ? file.name : "Click to select file (PDF, JPG, PNG)"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                        <AlertTriangle size={16} /> {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        "Submit Appeal"
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
                            >
                                <CheckCircle size={32} />
                            </motion.div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Request Submitted</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                Your appeal ID satisfies the {user?.dept || 'School'} protocol. <br />
                                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">REF: #{successId || '0000'}</span>
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AppealModal;
