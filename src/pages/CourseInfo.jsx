import React from 'react';
import { useStore } from '../context/Store';
import Card from '../components/Card';
import { BookOpen, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CourseInfo = () => {
    const { data } = useStore();
    const navigate = useNavigate();
    const subjects = data.subjects || [];

    // Calculate total planned classes
    const totalPlanned = subjects.reduce((acc, s) => {
        const t = s.academic_indicators?.policy?.total_classes || s.total_classes || 45;
        return acc + t;
    }, 0);

    const handleBack = () => {
        if (data.currentUser?.id) {
            navigate(`/student/${data.currentUser.id}/dashboard`);
        } else {
            navigate(-1); // Fallback
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="text-nmims-primary" />
                        Course Curriculum & Rules
                    </h2>
                    <p className="text-sm text-gray-500">
                        {data.currentUser?.program} • Year {data.currentUser?.year || 'Current'}
                    </p>
                </div>
                <button onClick={handleBack} className="text-sm text-gray-500 hover:text-gray-900">
                    &larr; Back to Dashboard
                </button>
            </div>

            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                <div className="flex gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg h-fit">
                        <Info size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900">Attendance Policy</h3>
                        <p className="text-sm text-blue-800 mt-1">
                            Your program requires specific attendance levels for each subject.
                            Failure to meet the <strong>Mandatory %</strong> may result in debarment.
                        </p>
                        <div className="flex gap-6 mt-4 text-sm">
                            <div>
                                <span className="block text-xs font-bold uppercase text-blue-600">Total Subjects</span>
                                <span className="font-bold text-xl">{subjects.length}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold uppercase text-blue-600">Total Planned Sessions</span>
                                <span className="font-bold text-xl">{totalPlanned}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Subject List */}
            <div className="space-y-4">
                {subjects.map((sub, i) => {
                    const total = sub.academic_indicators?.policy?.total_classes || sub.total_classes || 45;
                    const minPct = sub.stats?.minPct || 80; // Fallback
                    const minSessions = Math.ceil(total * (minPct / 100));

                    return (
                        <Card
                            key={i}
                            hoverEffect
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 cursor-pointer transition-transform hover:scale-[1.01]"
                            onClick={() => {
                                const studentId = data.currentUser?.id || window.location.pathname.split('/')[2];
                                if (studentId) {
                                    navigate(`/student/${studentId}/subject/${sub.subject_id}`);
                                } else {
                                    console.error("Navigation Error: Missing Student ID");
                                }
                            }}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-mono font-bold">
                                        {sub.subject_code || sub.code}
                                    </span>
                                    <h4 className="font-bold text-lg text-gray-900">{sub.name}</h4>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {sub.credits || 4} Credits • {total} Sessions Planned
                                </p>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <span className="block text-[10px] uppercase font-bold text-gray-400">Mandatory</span>
                                    <span className="block text-xl font-bold text-gray-900">{minPct}%</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-[10px] uppercase font-bold text-gray-400">Min. Classes</span>
                                    <span className="block text-xl font-bold text-nmims-primary">{minSessions}</span>
                                </div>
                                <div className="w-px h-10 bg-gray-200 hidden md:block"></div>
                                <div className="text-right">
                                    <span className="block text-xs font-medium text-gray-500">Currently</span>
                                    <span className={`block font-bold ${sub.stats?.percent >= minPct ? 'text-green-600' : 'text-red-600'}`}>
                                        {sub.stats?.percent || 0}%
                                    </span>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {subjects.length === 0 && (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        No curriculum data found for this semester.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseInfo;
