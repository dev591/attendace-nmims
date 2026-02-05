import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Shield, LogOut } from 'lucide-react';
import { useStore } from '../../context/Store';
import { useNavigate } from 'react-router-dom';
import config from '../../utils/config';

const API_BASE = config.API_URL;

export default function AdminDashboard() {
    const { user, logout } = useStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'logs'
    const [uploadType, setUploadType] = useState('student'); // 'student' | 'curriculum' | 'timetable'
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // { success: boolean, message: string }
    const [report, setReport] = useState(null); // For detailed backend report
    const [confirmReset, setConfirmReset] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleReset = async () => {
        setUploading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/reset`, {
                method: 'DELETE',
                headers: { 'x-admin-pw': 'antigravity' }
            });
            const data = await res.json();
            if (res.ok) {
                setUploadStatus({ success: true, message: data.message });
                setConfirmReset(false);
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            setUploadStatus({ success: false, message: e.message });
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus({ success: false, message: "Please select a file first." });
            return;
        }

        setUploading(true);
        setUploadStatus(null);
        setReport(null);

        const formData = new FormData();
        formData.append('file', file);

        // MVP: Hardcoded admin password header (or could use user token if auth updated)
        const headers = {
            'x-admin-pw': 'antigravity'
        };

        let endpoint = '';
        if (uploadType === 'student') endpoint = `${API_BASE}/import/upload`;
        if (uploadType === 'faculty') endpoint = `${API_BASE}/import/faculty`; // Added
        if (uploadType === 'curriculum') endpoint = `${API_BASE}/import/curriculum`;
        if (uploadType === 'timetable') endpoint = `${API_BASE}/admin/schedule/upload`;

        try {
            console.log(`[Admin] Uploading ${uploadType} to ${endpoint}`);
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            // Success Handling
            let msg = "Upload Successful";
            if (uploadType === 'student' && data.report) {
                msg = `Processed Students. Errors: ${data.report.errors?.length || 0}`;
                setReport(data.report);
            }
            if (uploadType === 'curriculum' && data.report) {
                msg = `Curriculum Imported. Inserted: ${data.report.inserted}`;
            }
            if (uploadType === 'timetable') {
                msg = data.message || "Timetable Imported";
            }

            setUploadStatus({ success: true, message: msg });

        } catch (err) {
            console.error("Upload Error:", err);
            setUploadStatus({ success: false, message: err.message });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                            <Shield size={18} />
                        </div>
                        <h1 className="font-bold text-lg tracking-tight">System Admin</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 font-medium">Logged in as {user?.name || 'Admin'}</span>
                        <button onClick={handleLogout} className="text-sm font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-8">
                <div className="flex items-center gap-6 mb-8">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'upload' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Data Ingestion
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'logs' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Data Management
                    </button>
                </div>

                {activeTab === 'upload' ? (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Data Ingestion</h2>
                        </div>

                        {/* TYPE SELECTOR */}
                        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl mb-8">
                            {[
                                { id: 'student', label: 'Student Master' },
                                { id: 'faculty', label: 'Faculty Master' }, // Added
                                { id: 'curriculum', label: 'Curriculum' },
                                { id: 'timetable', label: 'Timetable' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => { setUploadType(type.id); setUploadStatus(null); setReport(null); }}
                                    className={`py-2 px-4 rounded-lg text-sm font-bold capitalize transition-all ${uploadType === type.id
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <p className="text-gray-500 text-sm mb-4 font-medium">
                            Upload <strong>{uploadType === 'student' ? 'Student Master' : uploadType}</strong> data below.
                        </p>
                        <p className="text-gray-400 text-xs mb-8">
                            {uploadType === 'student' && "Populates Director Dashboard. Multi-sheet supported (Pharma, Engineering, etc)."}
                            {uploadType === 'faculty' && "Setup Faculty Directory. Expected: Name, SapID, Email, Phone, Dept, Designation"}
                            {uploadType === 'curriculum' && "Setup Subjects & Topics. Expected: Program, Branch, Year, Sem, Subject Code"}
                            {uploadType === 'timetable' && "Schedule Classes. Expected: Date, Time, Subject Code, Program, Branch"}
                        </p>

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".xlsx, .csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-3 pointer-events-none">
                                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                    <Upload size={24} />
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                    {file ? file.name : "Click to select or drag file here"}
                                </div>
                                <div className="text-xs text-gray-400">Excel (.xlsx) or CSV</div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {uploading ? "Uploading..." : "Start Ingestion"}
                            </button>
                        </div>

                        {uploadStatus && (
                            <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 text-sm ${uploadStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                {uploadStatus.success ? <CheckCircle size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
                                <div>
                                    <div className="font-bold">{uploadStatus.success ? "Success" : "Failed"}</div>
                                    <div className="opacity-90 mt-1">{uploadStatus.message}</div>
                                </div>
                            </div>
                        )}

                        {/* Error Report Details */}
                        {report && report.errors && report.errors.length > 0 && (
                            <div className="mt-4 p-4 bg-red-50 text-red-800 text-xs font-mono rounded-lg border border-red-100 max-h-48 overflow-y-auto">
                                <p className="font-bold mb-2">Error Details:</p>
                                {report.errors.map((e, i) => <div key={i}>{e}</div>)}
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-2xl">
                        <div className="flex items-center gap-3 mb-6 text-red-600">
                            <AlertCircle size={24} />
                            <h2 className="text-xl font-bold">Danger Zone</h2>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-8">
                            <h3 className="font-bold text-red-900 mb-2">Full System Reset</h3>
                            <p className="text-sm text-red-700 mb-4">
                                This action will permanently delete all <strong>Students</strong>, <strong>Attendance Records</strong>, and <strong>Enrollments</strong>.
                                <br />Director accounts and Curriculums will remained untouched.
                            </p>

                            {!confirmReset ? (
                                <button
                                    onClick={() => setConfirmReset(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-lg shadow-red-200"
                                >
                                    Reset System
                                </button>
                            ) : (
                                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <button
                                        onClick={handleReset}
                                        className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors border-2 border-red-500 flex items-center gap-2"
                                    >
                                        <LogOut size={16} /> Confirm Delete Everything
                                    </button>
                                    <button
                                        onClick={() => setConfirmReset(false)}
                                        className="text-gray-500 hover:bg-gray-100 font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
