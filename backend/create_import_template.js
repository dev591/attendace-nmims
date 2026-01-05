/* ADDED BY ANTI-GRAVITY */
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT_DIR = path.join(__dirname, 'uploads');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'college_single_import_template.xlsx');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 1. Data Structure
const students = [
    { student_id: 'S100', sapid: '90012023', name: 'Aarav Patel', email: 'aarav@demo.com', batch: '2023', roll_no: 'A001', program: 'Engineering', year: '2', dept: 'CS', course_id: 'C001', password_plain: 'password123' },
    { student_id: 'S101', sapid: '90022023', name: 'Diya Sharma', email: 'diya@demo.com', batch: '2023', roll_no: 'P001', program: 'Pharma', year: '1', dept: 'PH', course_id: 'C002', password_plain: 'securepass' },
    { student_id: 'S102', sapid: '90032023', name: 'Vivaan Singh', email: 'vivaan@demo.com', batch: '2024', roll_no: 'M001', program: 'MBA', year: '1', dept: 'BUS', course_id: 'C003', password_plain: '' },
    { student_id: 'S103', sapid: '90042023', name: 'Aditya Kumar', email: 'aditya@demo.com', batch: '2023', roll_no: 'A002', program: 'Engineering', year: '2', dept: 'CS', course_id: 'C001', password_plain: '' },
    { student_id: 'S104', sapid: '90052023', name: 'Saanvi Gupta', email: 'saanvi@demo.com', batch: '2023', roll_no: 'A003', program: 'Engineering', year: '2', dept: 'IT', course_id: 'C001', password_plain: '' },
    { student_id: 'S105', sapid: '90062023', name: 'Reyansh Reddy', email: 'reyansh@demo.com', batch: '2024', roll_no: 'M002', program: 'MBA', year: '1', dept: 'BUS', course_id: 'C003', password_plain: '' }
];

const subjects = [
    { subject_id: 'SUB_ENG_1', code: 'CS101', name: 'Advanced Java', total_classes: 40, min_attendance_pct: 75 },
    { subject_id: 'SUB_PH_1', code: 'PH101', name: 'Organic Chemistry', total_classes: 30, min_attendance_pct: 80 },
    { subject_id: 'SUB_MBA_1', code: 'MB101', name: 'Business Stats', total_classes: 35, min_attendance_pct: 70 }
];

const sessions = [
    { session_id: 'SESS_E1', subject_id: 'SUB_ENG_1', date: '2025-01-10', start_time: '10:00', end_time: '11:00', status: 'conducted' },
    { session_id: 'SESS_E2', subject_id: 'SUB_ENG_1', date: '2025-01-11', start_time: '10:00', end_time: '11:00', status: 'conducted' },
    { session_id: 'SESS_P1', subject_id: 'SUB_PH_1', date: '2025-01-10', start_time: '09:00', end_time: '10:00', status: 'conducted' }
];

const attendance = [
    { session_id: 'SESS_E1', student_id: 'S100', present: 'true', marked_at: '2025-01-10 10:05' },
    { session_id: 'SESS_E2', student_id: 'S100', present: 'true', marked_at: '2025-01-11 10:05' },
    { session_id: 'SESS_E1', student_id: 'S103', present: 'false', marked_at: '2025-01-10 10:05' },
    { session_id: 'SESS_P1', student_id: 'S101', present: 'true', marked_at: '2025-01-10 09:05' }
];

// 2. Create Workbook
const wb = XLSX.utils.book_new();

const wsStudents = XLSX.utils.json_to_sheet(students);
XLSX.utils.book_append_sheet(wb, wsStudents, 'Students');

const wsSubjects = XLSX.utils.json_to_sheet(subjects);
XLSX.utils.book_append_sheet(wb, wsSubjects, 'Subjects');

const wsSessions = XLSX.utils.json_to_sheet(sessions);
XLSX.utils.book_append_sheet(wb, wsSessions, 'Sessions');

const wsAttendance = XLSX.utils.json_to_sheet(attendance);
XLSX.utils.book_append_sheet(wb, wsAttendance, 'Attendance');

// 3. Write
XLSX.writeFile(wb, OUTPUT_FILE);
console.log(`✅ Template created at: ${OUTPUT_FILE}`);
