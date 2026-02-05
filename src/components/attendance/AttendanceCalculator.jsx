import React, { useState } from 'react';
import { useStore } from '../../context/Store';
import { Calculator, ArrowRight, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import config from '../../utils/config';

const AttendanceCalculator = () => {
    const { data, user } = useStore();
    const [selectedSubject, setSelectedSubject] = useState('');
    const [conducted, setConducted] = useState('');
    const [attended, setAttended] = useState('');

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const subjects = data.subjects || [];

    // Auto-fill Logic (User Request #2537)
    React.useEffect(() => {
        if (selectedSubject) {
            const subject = subjects.find(s => s.subject_id === selectedSubject);
            if (subject) {
                setConducted(subject.sessions_conducted);
                setAttended(subject.attended_classes);
            }
        }
    }, [selectedSubject, subjects]);

    const handleCalculate = async () => {
        if (!selectedSubject || conducted === '' || attended === '') {
            setError('Please fill all fields');
            return;
        }
        setLoading(true);
        setError('');
        setResult(null);

        try {
            // STRICT AUTH: Do not send SAPID manualy. Use Token.
            const res = await fetch(`${config.API_URL}/student/attendance-calculator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    subject_id: selectedSubject,
                    classes_conducted: parseInt(conducted),
                    classes_attended: parseInt(attended)
                })
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Calc failed');
            setResult(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Calculator size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Attendance Simulator</h3>
                    <p className="text-xs text-gray-500">Calculate safe zones & risks</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Target Subject</label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                        <option value="">Select Subject...</option>
                        {subjects.map(s => (
                            <option key={s.subject_code} value={s.subject_code}>
                                {s.subject_name} ({s.subject_code})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Simulated Conducted</label>
                    <input
                        type="number"
                        min="0"
                        value={conducted}
                        onChange={(e) => setConducted(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g 20"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Simulated Attended</label>
                    <input
                        type="number"
                        min="0"
                        value={attended}
                        onChange={(e) => setAttended(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g 15"
                    />
                </div>
            </div>

            <button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
                {loading ? 'Crunching Numbers...' : 'Calculate Scenario'}
                {!loading && <ArrowRight size={14} />}
            </button>

            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 p-5 rounded-lg border-l-4 ${result.status === 'SAFE' ? 'bg-green-50 border-green-500' :
                        result.status === 'WARNING' ? 'bg-yellow-50 border-yellow-500' : 'bg-red-50 border-red-500'
                        }`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${result.status === 'SAFE' ? 'bg-green-200 text-green-800' :
                                result.status === 'WARNING' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
                                }`}>
                                {result.status}
                            </span>
                            <h4 className="font-bold text-gray-900 mt-2 text-lg">
                                {result.current_pct}% <span className="text-gray-400 text-sm font-normal">Current Attendance</span>
                            </h4>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">Max Possible</div>
                            <div className="text-xl font-mono font-bold text-gray-700">{result.final_possible_pct}%</div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-700 font-medium mt-2 leading-relaxed">
                        {result.explanation_text}
                    </p>

                    <div className="mt-4 pt-3 border-t border-gray-200/50 grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="block text-gray-400 uppercase font-bold text-[10px]">Buffer Available</span>
                            <span className="font-mono text-base font-bold text-gray-800">{result.can_miss} Sessions</span>
                        </div>
                        <div>
                            <span className="block text-gray-400 uppercase font-bold text-[10px]">Must Attend Next</span>
                            <span className="font-mono text-base font-bold text-gray-800">{result.must_attend_next} Classes</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AttendanceCalculator;
