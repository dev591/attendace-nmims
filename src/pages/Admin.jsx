/* ADDED BY ANTI-GRAVITY */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { Upload, CheckCircle, AlertTriangle, FileText, Lock, Users, LogOut, Database, BookOpen, Calendar } from 'lucide-react';
import DataIntegrityBanner from '../components/DataIntegrityBanner';
import config from '../utils/config';

const Admin = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState(localStorage.getItem('admin_pw') || '');
    const [uploading, setUploading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ students: 0, sessions: 0 });
    // Demo Purge State
    const [confirmType, setConfirmType] = useState(null); // 'demo' | 'schedule' | 'curriculum' | null
    const [purging, setPurging] = useState(false);
    const [purgeReport, setPurgeReport] = useState(null);

    useEffect(() => {
        // Auth Check
        if (!localStorage.getItem('admin_authenticated')) {
            navigate('/admin/login');
            return;
        }
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const sRes = await fetch(`${config.API_URL}/debug/counts/students`);
            const sessRes = await fetch(`${config.API_URL}/debug/counts/sessions`);
            const sJson = await sRes.json();
            const sessJson = await sessRes.json();
            setStats({ students: sJson.count, sessions: sessJson.count });
        } catch (e) { console.error(e); }
    };

    const handleFileChange = (e) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);
        setReport(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('pw', password);

        try {
            const res = await fetch(`${config.API_URL}/import/upload`, {
                method: 'POST',
                headers: { 'x-admin-pw': password },
                body: formData
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Upload failed');

            setReport(json.report);
            fetchStats(); // Refresh stats
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_pw');
        navigate('/admin/login');
    };

    const handlePurge = async () => {
        if (!confirmType) return;
        setPurging(true);
        setPurgeReport(null);

        let url = '';
        if (confirmType === 'demo') url = `${config.API_URL}/admin/students/purge-all`;
        if (confirmType === 'schedule') url = `${config.API_URL}/admin/schedule/purge`;
        if (confirmType === 'curriculum') url = `${config.API_URL}/admin/curriculum/purge`;

        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const data = await res.json();

            if (res.ok) {
                setPurgeReport({ success: true, message: data.message, count: data.students_removed || 0 });
                fetchStats();
            } else {
                setPurgeReport({ success: false, message: data.error || "Purge failed" });
            }
        } catch (e) {
            setPurgeReport({ success: false, message: "Network Error: " + e.message });
        } finally {
            setPurging(false);
            setConfirmType(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-full mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Admin Control Center</h2>
                        <p className="text-sm text-gray-500">Manage College Data & Imports</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <div className="text-sm font-bold text-gray-900">System Status</div>
                            <div className="text-xs text-green-600 flex items-center justify-end gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Online</div>
                        </div>
                        <Button variant="secondary" onClick={handleLogout} className="flex items-center gap-2">
                            <LogOut size={16} /> Logout
                        </Button>
                    </div>
                </div>

                {/* Data Integrity Banner */}
                <DataIntegrityBanner />

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-gray-500 uppercase">Total Students</div>
                                <div className="text-3xl font-bold text-gray-900 my-1">{stats.students}</div>
                                <div className="text-xs text-green-600">Ready for Login</div>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
                        </div>
                    </Card>
                    <Card className="border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-gray-500 uppercase">Sessions Logged</div>
                                <div className="text-3xl font-bold text-gray-900 my-1">{stats.sessions}</div>
                                <div className="text-xs text-gray-400">Total Classes</div>
                            </div>
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Database size={24} /></div>
                        </div>
                    </Card>
                    <Card className="border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-gray-500 uppercase">System Health</div>
                                <div className="text-3xl font-bold text-gray-900 my-1">100%</div>
                                <div className="text-xs text-gray-400">Analytics Active</div>
                            </div>
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
                        </div>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (Uploads & Tools) */}
                    <div className="lg:col-span-2">
                        {/* 1. Master Sheet Upload */}
                        <Card className="h-full">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Upload size={20} className="text-nmims-primary" />
                                Bulk Data Import
                            </h3>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6 text-sm text-blue-800">
                                <strong>💡 Note:</strong> Uploading the Master Sheet will automatically create accounts for all students.
                                <ul className="list-disc ml-5 mt-1 space-y-1 text-xs">
                                    <li>If <code>password_plain</code> is missing, it defaults to <strong>password123</strong>.</li>
                                    <li>Students can login immediately using their SAP ID.</li>
                                    <li>Existing records will be updated safely.</li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative" onClick={() => document.getElementById('file-upload').click()}>
                                    <input type="file" onChange={handleFileChange} accept=".csv, .xlsx" className="hidden" id="file-upload" />
                                    <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                                        <FileText size={32} />
                                    </div>
                                    <span className="text-lg font-medium text-gray-700 block">
                                        {file ? file.name : "Click to Upload Master Sheet (Daily Attendance)"}
                                    </span>
                                    <span className="text-sm text-gray-400 mt-2 block">Supports .xlsx, .csv</span>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full justify-center py-4 text-lg shadow-lg shadow-nmims-primary/20"
                                    disabled={!file || uploading}
                                    onClick={handleUpload}
                                >
                                    {uploading ? 'Processing Data...' : 'Start Import & Sync'}
                                </Button>
                            </div>
                        </Card>

                        {/* 2. Curriculum Upload */}
                        <Card className="mt-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <BookOpen size={20} className="text-green-600" />
                                Upload Curriculum / Syllabus
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Upload syllabus structure (Program, Year, Subjects, Total Classes) to define mandatory attendance criteria.
                            </p>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => document.getElementById('curr-upload').click()}>
                                <input type="file" onChange={(e) => {
                                    if (e.target.files) {
                                        const f = e.target.files[0];
                                        if (!f) return;
                                        const fd = new FormData(); fd.append('file', f); fd.append('pw', password);
                                        fetch(`${config.API_URL}/import/curriculum`, { method: 'POST', body: fd, headers: { 'x-admin-pw': password } })
                                            .then(r => r.json())
                                            .then(d => {
                                                if (d.ok) {
                                                    setReport(d.report);
                                                    alert(`Curriculum Imported: ${d.report.inserted} items. See Live Report for details.`);
                                                } else {
                                                    alert('Error: ' + d.error);
                                                }
                                            });
                                    }
                                }} accept=".csv, .xlsx" className="hidden" id="curr-upload" />
                                <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                                    <Upload size={16} /> Select Syllabus File
                                </div>
                            </div>
                        </Card>

                        {/* 3. Timetable Scheduler */}
                        <Card className="mt-6 border-l-4 border-purple-600">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Calendar size={20} className="text-purple-600" />
                                Class Scheduler (Pre-SAP)
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Upload weekly timetables to drive the attendance engine. (Pre-integration mode)
                            </p>
                            <Button
                                variant="secondary"
                                className="w-full justify-center py-3 flex items-center gap-2 border border-purple-200 text-purple-700 hover:bg-purple-50"
                                onClick={() => navigate('/admin/schedule')}
                            >
                                <Calendar size={16} /> Open Scheduler
                            </Button>
                        </Card>

                        {/* 4. Danger Zone */}
                        <Card className="mt-6 border-l-4 border-red-500 bg-red-50">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-700">
                                <AlertTriangle size={20} />
                                Danger Zone
                            </h3>
                            <p className="text-sm text-red-600 mb-6">
                                Irreversible actions. Proceed with caution.
                            </p>

                            <div className="space-y-3">
                                <Button
                                    className="w-full justify-center py-3 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-none border-none"
                                    onClick={() => setConfirmType('demo')}
                                >
                                    <LogOut size={16} /> DELETE ALL STUDENTS (Reset Database)
                                </Button>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        className="justify-center py-3 flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 shadow-none border border-red-200"
                                        onClick={() => setConfirmType('schedule')}
                                    >
                                        <Calendar size={16} /> Wipe Scheduler
                                    </Button>
                                    <Button
                                        className="justify-center py-3 flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 shadow-none border border-red-200"
                                        onClick={() => setConfirmType('curriculum')}
                                    >
                                        <BookOpen size={16} /> Reset Curriculum
                                    </Button>
                                </div>
                            </div>

                            {/* Purge Report */}
                            {purgeReport && (
                                <div className={`mt-4 p-3 rounded text-sm font-bold ${purgeReport.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {purgeReport.message}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column (Live Report) */}
                    <div className="lg:col-span-1">
                        <Card className={`h-full flex flex-col ${report ? '' : 'opacity-70 grayscale'}`}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <CheckCircle size={20} className={report ? "text-green-600" : "text-gray-400"} />
                                Live Report
                            </h3>

                            {report ? (
                                <div className="flex-1 flex flex-col space-y-4">
                                    <div className="p-3 bg-green-50 text-green-800 rounded border border-green-100 animate-fade-in">
                                        <p className="font-bold flex items-center gap-2">
                                            <CheckCircle size={16} /> Import Successful
                                        </p>
                                        <p className="text-xs mt-1 opacity-80">Synced at {new Date(report.timestamp).toLocaleTimeString()}</p>
                                    </div>

                                    <div className="text-sm space-y-2 flex-1">
                                        <div className="flex justify-between border-b border-dashed py-2">
                                            <span className="text-gray-600">Errors</span>
                                            <span className={report.errors?.length > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                                                {report.errors?.length || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed py-2">
                                            <span className="text-gray-600">Created Courses</span>
                                            <span className="font-bold">{report.created_courses?.length || 0}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed py-2">
                                            <span className="text-gray-600">Subjects Synced</span>
                                            <span className="font-bold">{report.details?.filter(d => d.type === 'subject').length || 0}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed py-2">
                                            <span className="text-gray-600">Students Onboarded</span>
                                            <span className="font-bold text-nmims-primary">{report.details?.filter(d => d.type === 'student').length || 0}</span>
                                        </div>
                                    </div>

                                    {report.errors?.length > 0 && (
                                        <div className="mt-4 p-2 bg-red-50 rounded h-32 overflow-y-auto text-xs text-red-700 border border-red-100 font-mono">
                                            {report.errors.map((e, i) => <div key={i}>• {e}</div>)}
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center flex-col text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                                    <Database size={32} className="mb-2 opacity-20" />
                                    <span>Waiting for import...</span>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* CONFIRMATION MODAL (System Level, Outside Grid) */}
                {confirmType && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full m-4 border border-red-100">
                            <div className="p-3 bg-red-100 rounded-full w-fit mb-4 text-red-600">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {confirmType === 'demo' && 'DELETE ALL STUDENTS?'}
                                {confirmType === 'schedule' && 'Wipe Scheduler?'}
                                {confirmType === 'curriculum' && 'Reset Curriculum?'}
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {confirmType === 'demo' && "This will permanently delete ALL students, enrollments, and attendance records. Database will be 0."}
                                {confirmType === 'schedule' && "This will DELETE ALL SCHEDULED SESSIONS and associated attendance records. This creates a clean slate for a new timetable."}
                                {confirmType === 'curriculum' && <span>This will delete <b>ALL Curriculum, Subjects, and Enrollments</b>. You will need to re-upload the syllabus and re-enroll students.</span>}
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button variant="secondary" onClick={() => setConfirmType(null)} disabled={purging}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-red-600 hover:bg-red-700 text-white border-none"
                                    onClick={handlePurge}
                                    disabled={purging}
                                >
                                    {purging ? 'Deleting...' : 'Yes, Delete Everything'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Admin;
