import React, { useState } from 'react';
import { useStore } from '../context/Store';
import Card from '../components/Card';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { Award, TrendingDown, Target, Download, CalendarCheck, ShieldCheck, AlertTriangle, ArrowRight, Lock } from 'lucide-react';
import AttendanceCalculator from '../components/attendance/AttendanceCalculator';


const Analytics = () => {
    const { data, error } = useStore();
    const [expandFlexibility, setExpandFlexibility] = useState(false);

    // Strict Data Source
    const subjectStats = data.subjects || [];
    const weightedAndStats = data.weighted_pct || 0;
    const insights = data.currentUser?.analytics?.insight_events || [];

    // Terminology: "Attendance Flexibility" (formerly Bunk)
    // Find subjects where attendance > mandatory + buffer
    const flexibleSubjects = subjectStats.filter(s => s.can_still_miss > 0);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
                {/* 
                <button className="flex items-center gap-2 text-sm text-nmims-primary font-medium hover:underline">
                    <Download size={16} /> Export Report (PDF)
                </button> 
                */}
            </div>

            {/* Top Cards: Weighted & Goal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-2">Weighted Average</h3>
                    {/* STRICT: Backend Derived Only */}
                    <div className="text-3xl font-bold text-gray-900 mb-2">{weightedAndStats}%</div>
                    <p className="text-xs text-gray-400">Aggregated from valid credit courses</p>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4">
                        <div className="bg-nmims-primary h-1.5 rounded-full" style={{ width: `${weightedAndStats}%` }}></div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-2">Attendance Goal</h3>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{data.currentUser?.settings?.goal_pct || 75}%</div>
                    <p className="text-xs text-gray-400">Target Benchmark</p>
                    {weightedAndStats < (data.currentUser?.settings?.goal_pct || 75) && (
                        <div className="mt-4 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block">
                            Below Target
                        </div>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COL: Detailed Subject Audit */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Target size={18} /> Subject Performance & Audit
                        </h3>
                        <div className="space-y-4">
                            {subjectStats.map((sub) => {
                                const indicators = sub.academic_indicators || {};
                                const audit = sub.audit_trail || {};

                                // Local State for Audit Drawer would need a component split, 
                                // but for simplicity we will use a Details/Summary HTML tag or just render it.
                                // React way:
                                return (
                                    <div key={sub.subject_id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                                        <div className="bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-900">{sub.subject_name}</h4>
                                                    <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded uppercase">{sub.subject_code}</span>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {/* Confidence Badge */}
                                                    {indicators.confidence_index && (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${indicators.confidence_index === 'HIGH_CONFIDENCE' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            indicators.confidence_index === 'MODERATE' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                'bg-red-50 text-red-700 border-red-200'
                                                            }`}>
                                                            Confidence: {indicators.confidence_index.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                    {/* Survival Badge */}
                                                    {indicators.survival_status && (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${indicators.survival_status === 'SURVIVABLE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-gray-800 text-white border-gray-900'
                                                            }`}>
                                                            Subject: {indicators.survival_status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className={`text-2xl font-mono font-bold ${indicators.danger_zone ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {sub.attendance_percentage}%
                                                </div>
                                                <div className="text-[10px] text-gray-500">Mandatory: {indicators.policy?.mandatory_pct}%</div>
                                            </div>
                                        </div>

                                        {/* AUDIT DRAWER (Always visible or toggleable details) */}
                                        <details className="group border-t border-gray-100">
                                            <summary className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 cursor-pointer hover:bg-gray-100 flex items-center gap-2 select-none">
                                                <ArrowRight size={12} className="group-open:rotate-90 transition-transform" />
                                                View Calculation Logic (Audit)
                                            </summary>
                                            <div className="p-4 bg-gray-50 text-xs font-mono text-gray-600 space-y-2">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="block text-gray-400 uppercase text-[9px]">Formula</span>
                                                        <span>{audit.formula_used || "(attended / conducted) * 100"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-400 uppercase text-[9px]">Verified On</span>
                                                        <span>{data.analytics?.lastUpdated ? new Date(data.analytics.lastUpdated).toLocaleDateString() : 'Now'}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-200">
                                                    <div className="text-center">
                                                        <div className="font-bold text-gray-900">{audit.conducted}</div>
                                                        <div className="text-[9px] uppercase text-gray-400">Conducted</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-green-600">{audit.attended}</div>
                                                        <div className="text-[9px] uppercase text-gray-400">Attended</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-gray-900">{audit.remaining}</div>
                                                        <div className="text-[9px] uppercase text-gray-400">Remaining</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* DANGER ZONE PANEL */}
                    {subjectStats.some(s => s.academic_indicators?.danger_zone) ? (
                        <Card className="border-t-4 border-t-red-500">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                    <AlertTriangle size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900">Danger Zone (Recovery Required)</h3>
                            </div>
                            <div className="space-y-3">
                                {subjectStats.filter(s => s.academic_indicators?.danger_zone).map(sub => (
                                    <div key={sub.subject_id} className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-100">
                                        <div className="font-bold text-red-900 text-sm">{sub.subject_name}</div>
                                        <div className="text-xs text-red-800 font-bold">
                                            Attend next {sub.academic_indicators.danger_details?.classes_needed_to_recover} classes
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <Card className="border-t-4 border-t-green-500">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={20} className="text-green-600" />
                                <div>
                                    <h3 className="font-bold text-gray-900">Safe Zone</h3>
                                    <p className="text-xs text-green-700">All subjects are above mandatory limits. No action required.</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* RIGHT COL: Simulator & Badges */}
                <div className="space-y-8">
                    {/* Simulator */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">Simulator</h3>
                        <AttendanceCalculator />
                    </div>

                    {/* BADGES (Backend Sorted) */}

                </div>
            </div>


        </div>
    );
};

// Sub-components can be extracted later, keeping here for context


export default Analytics;
