-- 1. CLEAN SLATE
TRUNCATE TABLE announcements, student_badges, project_submissions, ica_marks, attendance, sessions, enrollments, subjects, students CASCADE;

-- 2. CREATE DIRECTOR
INSERT INTO students (sapid, password, name, role, email, phone)
VALUES ('DIRECTOR', '$2a$10$X.Y.Z.HASH.PASS', 'Director Admin', 'director', 'director@nmims.edu', '9999999999');
-- Note: Password hash should be valid if you want to login, but for now assuming frontend bypass or existing hash

-- 3. CREATE TEST STUDENT
-- SAPID: 590000001, Pass: 12345 (Hash: $2a$10$abcdefg...) - strictly using simple update for password later if needed
INSERT INTO students (sapid, password, name, role, program, dept, year, semester, phone, email)
VALUES ('590000001', '$2b$10$eWjV2K.X.Y.Z.HASH.PASS', 'Test Student', 'student', 'B.Tech', 'Computer Science', 3, 6, '9876543210', 'test@student.nmims.edu');

-- 4. CREATE SUBJECTS
INSERT INTO subjects (subject_id, name, code, credits, semester, program)
VALUES 
('SUB_MATH', 'Engineering Mathematics', 'MATH101', 4, 6, 'B.Tech'),
('SUB_PHYS', 'Engineering Physics', 'PHYS101', 4, 6, 'B.Tech');

-- 5. CREATE ENROLLMENTS
INSERT INTO enrollments (student_id, subject_id)
SELECT student_id, 'SUB_MATH' FROM students WHERE sapid = '590000001';

INSERT INTO enrollments (student_id, subject_id)
SELECT student_id, 'SUB_PHYS' FROM students WHERE sapid = '590000001';

-- 6. CREATE SESSIONS (Past)
INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, type, room, status)
VALUES 
('SESS_001', 'SUB_MATH', CURRENT_DATE - INTERVAL '2 days', '10:00', '11:00', 'Lecture', '601', 'conducted'),
('SESS_002', 'SUB_PHYS', CURRENT_DATE - INTERVAL '1 day', '12:00', '13:00', 'Lecture', '602', 'conducted');

-- 7. CREATE ATTENDANCE
-- Present for Math
INSERT INTO attendance (session_id, student_id, present, marked_at)
SELECT 'SESS_001', student_id, true, CURRENT_TIMESTAMP 
FROM students WHERE sapid = '590000001';

-- Absent for Physics
INSERT INTO attendance (session_id, student_id, present, marked_at)
SELECT 'SESS_002', student_id, false, CURRENT_TIMESTAMP 
FROM students WHERE sapid = '590000001';

-- 8. CREATE ICA MARKS
INSERT INTO ica_marks (student_id, subject_id, test_name, marks_obtained, total_marks)
SELECT student_id, 'SUB_MATH', 'Internal 1', 18, 20
FROM students WHERE sapid = '590000001';

-- 9. CREATE PROJECT SUBMISSIONS
INSERT INTO project_submissions (student_id, title, description, link, status, submitted_at)
SELECT student_id, 'Physics Simulation', 'A simulation of gravity using Python.', 'https://github.com/test/gravity', 'Verified', CURRENT_TIMESTAMP
FROM students WHERE sapid = '590000001';

-- 10. CREATE ANNOUNCEMENT
INSERT INTO announcements (title, message, target_group, created_at)
VALUES ('Welcome to Director Dashboard', 'The system has been reset with verified test data.', 'all', CURRENT_TIMESTAMP);
