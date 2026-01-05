export const MOCK_DATA = {
    currentUser: {
        student_id: 'S001',
        name: 'Dev Chalana',
        role: 'student',
        program: 'B.Tech CS-DS',
        year: 2,
        roll_no: 'CS201',
        profile_pic: 'https://ui-avatars.com/api/?name=Dev+Chalana&background=D50000&color=fff',
        settings: {
            goal_pct: 85,
            notifications: true
        },
        analytics: {
            current_streak: 5,
            max_streak: 12,
            rank_percentile: 5, // Top 5%
            best_day: 'Monday',
            best_day_pct: 92,
            worst_day: 'Friday',
            worst_day_pct: 41,
            weekly_heatmap: [
                { day: 'S', status: 'none' },
                { day: 'M', status: 'present' },
                { day: 'T', status: 'present' },
                { day: 'W', status: 'absent' },
                { day: 'T', status: 'present' },
                { day: 'F', status: 'absent' },
                { day: 'S', status: 'none' }
            ],
            badges: ['Perfect Week', 'Early Bird', 'Lab Wizard']
        }
    },
    notifications: [
        { id: 1, type: 'danger', message: 'You dropped below 70% in OS.', time: '2 hrs ago' },
        { id: 2, type: 'info', message: 'Attendance updated on portal.', time: '5 hrs ago' },
        { id: 3, type: 'success', message: 'Streak continued: 5 days.', time: '1 day ago' }
    ],
    upcoming_events: [
        { id: 1, title: 'OS Lab Internal', date: 'Dec 15', type: 'Exam' },
        { id: 2, title: 'Christmas Holiday', date: 'Dec 25', type: 'Holiday' }
    ],
    subjects: [
        {
            subject_id: 'SUB01',
            code: 'DS101',
            name: 'Data Structures',
            T: 45,
            C: 25,
            A: 17, // 68% - Low
            credits: 4,
            class_avg: 72,
            difficulty: 'High',
            sessions: [
                { id: 'S1', date: '2025-12-01', time: '09:00', type: 'Lecture', status: 'conducted', present: true },
                { id: 'S2', date: '2025-12-03', time: '09:00', type: 'Lecture', status: 'conducted', present: false }
            ]
        },
        {
            subject_id: 'SUB02',
            code: 'AL102',
            name: 'Algorithms',
            T: 40,
            C: 20,
            A: 18, // 90% - Good
            credits: 4,
            class_avg: 85,
            difficulty: 'Medium',
            sessions: []
        },
        {
            subject_id: 'SUB03',
            code: 'DB103',
            name: 'Database Systems',
            T: 35,
            C: 15,
            A: 11, // 73% - Borderline
            credits: 3,
            class_avg: 75,
            difficulty: 'Medium',
            sessions: []
        },
        {
            subject_id: 'SUB04',
            code: 'OS104',
            name: 'Operating System',
            T: 30,
            C: 10,
            A: 6, // 60% - Critical
            credits: 3,
            class_avg: 68,
            difficulty: 'High',
            sessions: []
        }
    ],
    timetable: [
        { id: 'T1', subject_id: 'SUB01', time: '09:00 AM', duration: '1h', room: 'Room 301', status: 'upcoming' },
        { id: 'T2', subject_id: 'SUB02', time: '10:00 AM', duration: '1h', room: 'Lab 2', status: 'upcoming' },
        { id: 'T3', subject_id: 'SUB03', time: '11:00 AM', duration: '1h', room: 'Room 101', status: 'upcoming' }
    ]
};

// Calculations
export const calculateStats = (T, C, A, required = 0.75) => {
    const percent = C === 0 ? 100 : Math.round((A / C) * 100);
    const required_total = Math.ceil(required * T);
    const remaining = T - C;
    const needed_from_remaining = Math.max(0, required_total - A);

    // Projection Logic
    const attendNextPct = Math.round(((A + 1) / (C + 1)) * 100);
    const missNextPct = Math.round(((A) / (C + 1)) * 100);

    // Can miss
    const possible_final_attendance = A + remaining;
    const buffer = possible_final_attendance - required_total;
    const canMiss = Math.max(0, Math.min(buffer, remaining));

    const isDanger = percent < 65;
    const isWarning = percent >= 65 && percent < 75;
    const isSafe = percent >= 75;

    return {
        percent, canMiss, mustAttend: needed_from_remaining,
        isSafe, isWarning, isDanger, remaining,
        attendNextPct, missNextPct
    };
};

export const calculateWeightedAverage = (subjects) => {
    let totalCredits = 0;
    let weightedSum = 0;
    subjects.forEach(sub => {
        const pct = sub.C === 0 ? 100 : (sub.A / sub.C) * 100;
        weightedSum += pct * sub.credits;
        totalCredits += sub.credits;
    });
    return totalCredits === 0 ? 0 : Math.round(weightedSum / totalCredits);
};
