/* ADDED BY ANTI-GRAVITY */

/* 1. Students */
INSERT INTO students (student_id, sapid, name, course_id, password_hash)
VALUES 
('S001', '50012023', 'Dev Chalana', 'Engineering', '$2a$10$DemoHashForTestingPurposeOnly123'),
('S002', '50022023', 'Rohan Mehta', 'Pharma', '$2a$10$DemoHashForTestingPurposeOnly123'),
('S003', '50032023', 'New Student', 'MBA', '$2a$10$DemoHashForTestingPurposeOnly123')
ON CONFLICT (sapid) DO NOTHING;

/* 2. Subjects */
INSERT INTO subjects (subject_id, code, name, total_sessions, credits)
VALUES
('DSA101', 'DSA101', 'Data Structures', 45, 4),
('DBMS101', 'DBMS101', 'Database Systems', 40, 4),
('PHAR101', 'PHAR101', 'Pharmacology', 30, 3)
ON CONFLICT (subject_id) DO NOTHING;

/* Link subjects to course (assuming course_subjects table or similar logic exists, typically via Enrollments or course_subjects map) */
/* Using enrollments for direct mapping as a fallback or primary method depending on schema */
INSERT INTO enrollments (student_id, subject_id) VALUES
('S001', 'DSA101'), ('S001', 'DBMS101'),
('S002', 'PHAR101'),
('S003', 'DSA101')
ON CONFLICT DO NOTHING;

/* 3. Sessions (21 total) */
/* DSA101: 10 Sessions (Conducted) */
INSERT INTO sessions (session_id, subject_id, date, start_time, duration, room, status) VALUES
('SESS_D1', 'DSA101', CURRENT_DATE - INTERVAL '10 days', '10:00:00', '01:00:00', '101', 'conducted'),
('SESS_D2', 'DSA101', CURRENT_DATE - INTERVAL '9 days', '10:00:00', '01:00:00', '101', 'conducted'),
('SESS_D3', 'DSA101', CURRENT_DATE - INTERVAL '8 days', '10:00:00', '01:00:00', '101', 'conducted'),
('SESS_D4', 'DSA101', CURRENT_DATE - INTERVAL '7 days', '10:00:00', '01:00:00', '101', 'conducted'),
('SESS_D5', 'DSA101', CURRENT_DATE - INTERVAL '6 days', '10:00:00', '01:00:00', '101', 'conducted'),
('SESS_D6', 'DSA101', CURRENT_DATE - INTERVAL '5 days', '10:00:00', '01:00:00', '101', 'conducted'),
('SESS_D7', 'DSA101', CURRENT_DATE - INTERVAL '4 days', '10:00:00', '01:00:00', '101', 'conducted'),
('SESS_D8', 'DSA101', CURRENT_DATE - INTERVAL '3 days', '10:00:00', '01:00:00', '101', 'conducted'),
('SESS_D9', 'DSA101', CURRENT_DATE - INTERVAL '2 days', '10:00:00', '01:00:00', '101', 'conducted'),
('SESS_D10','DSA101', CURRENT_DATE - INTERVAL '1 days', '10:00:00', '01:00:00', '101', 'conducted')
ON CONFLICT (session_id) DO NOTHING;

/* DBMS101: 6 Sessions */
INSERT INTO sessions (session_id, subject_id, date, start_time, duration, room, status) VALUES
('SESS_DB1', 'DBMS101', CURRENT_DATE - INTERVAL '6 days', '12:00:00', '01:00:00', '202', 'conducted'),
('SESS_DB2', 'DBMS101', CURRENT_DATE - INTERVAL '5 days', '12:00:00', '01:00:00', '202', 'conducted'),
('SESS_DB3', 'DBMS101', CURRENT_DATE - INTERVAL '4 days', '12:00:00', '01:00:00', '202', 'conducted'),
('SESS_DB4', 'DBMS101', CURRENT_DATE - INTERVAL '3 days', '12:00:00', '01:00:00', '202', 'conducted'),
('SESS_DB5', 'DBMS101', CURRENT_DATE - INTERVAL '2 days', '12:00:00', '01:00:00', '202', 'conducted'),
('SESS_DB6', 'DBMS101', CURRENT_DATE - INTERVAL '1 days', '12:00:00', '01:00:00', '202', 'conducted')
ON CONFLICT (session_id) DO NOTHING;

/* PHAR101: 5 Sessions */
INSERT INTO sessions (session_id, subject_id, date, start_time, duration, room, status) VALUES
('SESS_P1', 'PHAR101', CURRENT_DATE - INTERVAL '5 days', '09:00:00', '01:00:00', 'LAB1', 'conducted'),
('SESS_P2', 'PHAR101', CURRENT_DATE - INTERVAL '4 days', '09:00:00', '01:00:00', 'LAB1', 'conducted'),
('SESS_P3', 'PHAR101', CURRENT_DATE - INTERVAL '3 days', '09:00:00', '01:00:00', 'LAB1', 'conducted'),
('SESS_P4', 'PHAR101', CURRENT_DATE - INTERVAL '2 days', '09:00:00', '01:00:00', 'LAB1', 'conducted'),
('SESS_P5', 'PHAR101', CURRENT_DATE - INTERVAL '1 days', '09:00:00', '01:00:00', 'LAB1', 'conducted')
ON CONFLICT (session_id) DO NOTHING;

/* 4. Attendance */

/* S001 (Dev): High Attendance in DSA (Streak possible) */
INSERT INTO attendance (session_id, student_id, present, source) VALUES
('SESS_D1', 'S001', true, 'seed'),
('SESS_D2', 'S001', true, 'seed'),
('SESS_D3', 'S001', true, 'seed'), -- 3 streak
('SESS_D4', 'S001', false, 'seed'), -- Break
('SESS_D5', 'S001', true, 'seed'),
('SESS_D6', 'S001', true, 'seed'),
('SESS_D7', 'S001', true, 'seed'),
('SESS_D8', 'S001', true, 'seed'), -- 4 streak
('SESS_D9', 'S001', true, 'seed'), -- 5 streak
('SESS_D10','S001', true, 'seed'), -- 6 streak
/* S001 in DBMS */
('SESS_DB1', 'S001', true, 'seed'),
('SESS_DB2', 'S001', false, 'seed')
ON CONFLICT (session_id, student_id) DO NOTHING;

/* S002 (Rohan): Perfect Pharma */
INSERT INTO attendance (session_id, student_id, present, source) VALUES
('SESS_P1', 'S002', true, 'seed'),
('SESS_P2', 'S002', true, 'seed'),
('SESS_P3', 'S002', true, 'seed'),
('SESS_P4', 'S002', true, 'seed'),
('SESS_P5', 'S002', true, 'seed')
ON CONFLICT (session_id, student_id) DO NOTHING;

/* S003 (New): Sporadic */
INSERT INTO attendance (session_id, student_id, present, source) VALUES
('SESS_D1', 'S003', false, 'seed'),
('SESS_D2', 'S003', true, 'seed')
ON CONFLICT (session_id, student_id) DO NOTHING;

/* 5. Events Helper (if not exists) & Seed */
CREATE TABLE IF NOT EXISTS events (
    event_id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    type VARCHAR(50),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO events (student_id, type, details)
VALUES ('S001', 'correction_approved', '{"reason": "Medical leave approved"}')
ON CONFLICT DO NOTHING; -- No conflict key usually, so this might duplicate if run multiple times, but acceptable for demo unless we add constraint.
