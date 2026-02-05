import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertTriangle, AlertCircle, Calendar, Download, RefreshCw } from 'lucide-react';
import Card from "../components/Card";
import Button from "../components/Button";
import config from '../utils/config';

const AdminSchedule = () => {
    // Upload State
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error, partial_error
    const [message, setMessage] = useState('');
    const [apiResponse, setApiResponse] = useState(null);
    const [showDebug, setShowDebug] = useState(false);

    // Template State
    const [templateProg, setTemplateProg] = useState('Engineering');
    const [templateSem, setTemplateSem] = useState(1);
    const [downloading, setDownloading] = useState(false);

    // Upload Scope State (Strict)
    const [uploadSchool, setUploadSchool] = useState('MPSTME');
    const [uploadPro, setUploadPro] = useState('B.Tech');
    const [uploadYear, setUploadYear] = useState(3);
    const [uploadSem, setUploadSem] = useState(6);
    const [uploadSec, setUploadSec] = useState('A');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setApiResponse(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        const formData = new FormData();

        // Append Strict Scope (MUST BE BEFORE FILE)
        formData.append('school', uploadSchool);
        formData.append('program', uploadPro);
        formData.append('year', uploadYear);
        formData.append('semester', uploadSem);
        formData.append('section', uploadSec);

        // Append File Last
        formData.append('file', file);

        try {
            const res = await fetch(`${config.API_URL}/admin/schedule/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            setApiResponse(data);

            if (res.ok) {
                setStatus('success');
                setMessage(data.message);
            } else {
                setStatus('error');
                setMessage(data.message || data.error || 'Upload failed');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error. Ensure backend is running.');
        }
    };

    const downloadTemplate = async () => {
        setDownloading(true);
        try {
            const url = `${config.API_URL}/admin/schedule/template?program=${templateProg}&semester=${templateSem}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to generate");

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `timetable_template_${templateProg}_sem${templateSem}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            alert("Error downloading template.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                    Admin Scheduler
                </h1>
                <p className="text-gray-500 mt-2">Manage class timetables strictly based on the approved curriculum.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Template Generator */}
                <Card className="p-6 border-l-4 border-blue-500 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Download size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">1. Get Safe Template</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        Avoid errors by using a pre-generated template containing <b>only valid subjects</b> for the selected semester.
                    </p>

                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Program</label>
                            <select
                                value={templateProg}
                                onChange={(e) => setTemplateProg(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                            >
                                <option value="Engineering">Engineering</option>
                                <option value="Pharma">Pharma</option>
                                <option value="Management">Management</option>
                                <option value="Commerce">Commerce</option>
                                <option value="Law">Law</option>
                                <option value="Design">Design</option>
                                <option value="Architecture">Architecture</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Semester</label>
                            <select
                                value={templateSem}
                                onChange={(e) => setTemplateSem(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                            </select>
                        </div>
                    </div>

                    <Button
                        onClick={downloadTemplate}
                        disabled={downloading}
                        className="mt-6 w-full justify-center py-3 bg-blue-600 text-white hover:bg-blue-700"
                    >
                        {downloading ? 'Taking Snapshot...' : 'Download Official Template'}
                    </Button>
                </Card>

                {/* 2. Upload Area */}
                <Card className="p-6 border-l-4 border-purple-500 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Upload size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">2. Upload Timetable</h2>
                    </div>

                    {/* SCOPE SELECTORS (STRICT) */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Target School</label>
                            <select value={uploadSchool} onChange={(e) => setUploadSchool(e.target.value)} className="w-full p-2 text-sm border-purple-200 rounded">
                                <option value="MPSTME">Engineering (MPSTME)</option>
                                <option value="SBM">Management (SBM)</option>
                                <option value="KPMSOL">Law (KPMSOL)</option>
                                <option value="SPPSPTM">Pharma (SPPSPTM)</option>
                                <option value="ASMSOC">Commerce (ASMSOC)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Program</label>
                            <input type="text" value={uploadPro} onChange={(e) => setUploadPro(e.target.value)} placeholder="e.g. B.Tech" className="w-full p-2 text-sm border-purple-200 rounded" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Section</label>
                            <select value={uploadSec} onChange={(e) => setUploadSec(e.target.value)} className="w-full p-2 text-sm border-purple-200 rounded">
                                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Year</label>
                            <select value={uploadYear} onChange={(e) => {
                                setUploadYear(e.target.value);
                                // Auto-suggest semester
                                const y = parseInt(e.target.value);
                                setUploadSem(y * 2 - 1); // Default to odd sem (start of year)
                            }} className="w-full p-2 text-sm border-purple-200 rounded">
                                <option value={1}>Year 1</option>
                                <option value={2}>Year 2</option>
                                <option value={3}>Year 3</option>
                                <option value={4}>Year 4</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Semester</label>
                            <select value={uploadSem} onChange={(e) => setUploadSem(e.target.value)} className="w-full p-2 text-sm border-purple-200 rounded">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors">
                        {file ? (
                            <>
                                <div className="p-3 bg-green-100 rounded-full text-green-600 animate-bounce">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 truncate max-w-[200px]">{file.name}</h3>
                                    <p className="text-xs text-green-600 font-bold">Ready</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-3 bg-gray-100 rounded-full text-gray-400">
                                    <FileText size={24} />
                                </div>
                                <p className="text-sm text-gray-400">Drag & drop or click to select</p>
                            </>
                        )}

                        <input type="file" accept=".csv, .xlsx" onChange={handleFileChange} className="hidden" id="file-upload" />
                        <label htmlFor="file-upload" className="cursor-pointer text-purple-600 font-bold hover:underline">
                            {file ? 'Change File' : 'Browse Files'}
                        </label>
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={!file || status === 'uploading'}
                        className={`mt-6 w-full justify-center py-3 ${status === 'uploading' ? 'bg-gray-400' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                    >
                        {status === 'uploading' ? 'Scanning...' : 'Upload & Sync'}
                    </Button>
                </Card>
            </div>

            {/* 3. Feedback Section */}
            {status === 'success' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="bg-green-50 border border-green-200 p-6 flex items-start gap-4">
                        <CheckCircle className="text-green-600 mt-1" size={24} />
                        <div>
                            <h3 className="font-bold text-green-900 text-lg">Upload Complete</h3>
                            <p className="text-green-800">{message}</p>
                            <div className="mt-2 text-sm text-green-700 bg-white/50 p-2 rounded">
                                ✅ {apiResponse?.details?.inserted_sessions || 0} sessions scheduled.
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {status === 'error' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="bg-amber-50 border border-amber-200 p-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="text-amber-600 mt-1" size={32} />
                            <div className="flex-1">
                                <h3 className="font-bold text-amber-900 text-lg">
                                    {message || "Upload Incomplete"}
                                </h3>
                                {/* Friendly Help Text */}
                                {apiResponse?.help ? (
                                    <div className="mt-2 space-y-2">
                                        <p className="text-amber-800 font-medium">{apiResponse.help.message}</p>
                                        <div className="flex items-center gap-2 text-sm text-blue-700 bg-white/60 p-3 rounded-lg border border-blue-100">
                                            <Download size={16} />
                                            <span><b>Recommended Action:</b> {apiResponse.help.action}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-amber-800 mt-1">Please check your file and try again.</p>
                                )}

                                {/* Collapsible Debug Log */}
                                <div className="mt-4">
                                    <button
                                        onClick={() => setShowDebug(!showDebug)}
                                        className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                                    >
                                        {showDebug ? 'Hide Technical Details' : 'Show Error Log'}
                                    </button>

                                    {showDebug && apiResponse?.details?.errors && (
                                        <div className="mt-2 bg-white rounded border border-amber-200 p-4 max-h-64 overflow-y-auto">
                                            <ul className="space-y-1 text-xs text-red-700 font-mono">
                                                {apiResponse.details.errors.map((err, i) => (
                                                    <li key={i}>
                                                        {typeof err === 'string' ? `• ${err}` : (
                                                            <span>• <b>Row {err.row}:</b> {err.reason} {err.details ? `(${err.details})` : ''}</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default AdminSchedule;
