/* ADDED BY ANTI-GRAVITY */
import xlsx from 'xlsx';
import path from 'path';

const workbook = xlsx.utils.book_new();

// 1. Students Sheet
const students = [
    { sapid: "90001", name: "Rahul Sharma", email: "rahul@nmims.edu", program: "B.Tech CS", course_id: "BTECH_CS_2025", password_plain: "password123" },
    { sapid: "90002", name: "Priya Patel", email: "priya@nmims.edu", program: "B.Tech CS", course_id: "BTECH_CS_2025", password_plain: "password123" },
    { sapid: "90003", name: "Aditya Verma", email: "aditya@nmims.edu", program: "MBA", course_id: "MBA_2025", password_plain: "password123" }
];
const wsStudents = xlsx.utils.json_to_sheet(students);
xlsx.utils.book_append_sheet(workbook, wsStudents, "Students");

// 2. Subjects Sheet
const subjects = [
    { subject_id: "CS101", name: "Data Structures", course_id: "BTECH_CS_2025", semester: 3, credits: 4 },
    { subject_id: "CS102", name: "Database Mgmt", course_id: "BTECH_CS_2025", semester: 3, credits: 4 },
    { subject_id: "MBA101", name: "Marketing Mgmt", course_id: "MBA_2025", semester: 1, credits: 3 }
];
const wsSubjects = xlsx.utils.json_to_sheet(subjects);
xlsx.utils.book_append_sheet(workbook, wsSubjects, "Subjects");

// 3. Sessions Sheet
const sessions = [
    { session_id: "SES001", subject_id: "CS101", date: "2025-10-01", start_time: "09:00", end_time: "10:00", type: "Lecture", room: "501" },
    { session_id: "SES002", subject_id: "CS101", date: "2025-10-02", start_time: "09:00", end_time: "10:00", type: "Lecture", room: "501" },
    { session_id: "SES003", subject_id: "CS102", date: "2025-10-01", start_time: "11:00", end_time: "12:00", type: "Lab", room: "LAB1" }
];
const wsSessions = xlsx.utils.json_to_sheet(sessions);
xlsx.utils.book_append_sheet(workbook, wsSessions, "Sessions");

// 4. Attendance Sheet (Matrix)
const attendance = [
    { session_id: "SES001", "90001": "P", "90002": "P", "90003": "N/A" },
    { session_id: "SES002", "90001": "A", "90002": "P", "90003": "N/A" },
    { session_id: "SES003", "90001": "P", "90002": "P", "90003": "N/A" }
];
const wsAttendance = xlsx.utils.json_to_sheet(attendance);
xlsx.utils.book_append_sheet(workbook, wsAttendance, "Attendance");

// Write
const outFile = path.join(process.cwd(), "nmims_master_import_template.xlsx");
xlsx.writeFile(workbook, outFile);

console.log(`✅ Master Template Generated: ${outFile}`);
console.log(`\nSteps to use in Real Life:`);
console.log(`1. Edit this Excel file with your real college data.`);
console.log(`2. Go to http://localhost:5173/admin`);
console.log(`3. Upload the file.`);
console.log(`4. Ask students to login with their SAPID and the password you set.`);
