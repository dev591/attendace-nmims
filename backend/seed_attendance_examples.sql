/* ADDED BY ANTI-GRAVITY */
-- Seed: Sample Subject and Attendance for Analytics

-- 1. Upsert Subject DSA101
INSERT INTO subjects (subject_id, code, name, total_classes, min_attendance_pct)
VALUES ('DSA101', 'DSA101', 'Data Structures & Algorithms', 45, 80)
ON CONFLICT (subject_id) 
DO UPDATE SET total_classes=45, min_attendance_pct=80, code='DSA101';

-- 2. Ensure students exist (using upsert safety from previous seeds usually, but here we assume S001-S005 might need to be linked)
-- We'll assume the students exist or just insert the analytics data if they do.
-- Actually, let's create a few sessions for DSA101
INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, status)
VALUES 
('DSA_S01', 'DSA101', '2025-01-10', '10:00', '11:00', 'conducted'),
('DSA_S02', 'DSA101', '2025-01-12', '10:00', '11:00', 'conducted'),
('DSA_S03', 'DSA101', '2025-01-14', '10:00', '11:00', 'conducted'),
('DSA_S04', 'DSA101', '2025-01-16', '10:00', '11:00', 'conducted'),
('DSA_S05', 'DSA101', '2025-01-18', '10:00', '11:00', 'conducted'),
('DSA_S06', 'DSA101', '2025-01-20', '10:00', '11:00', 'conducted')
ON CONFLICT (session_id) DO NOTHING;

-- 3. Insert specific attendance patterns
-- S001 (High Attendance): 6/6
INSERT INTO attendance (session_id, student_id, present)
VALUES
('DSA_S01', 'S001', true),
('DSA_S02', 'S001', true),
('DSA_S03', 'S001', true),
('DSA_S04', 'S001', true),
('DSA_S05', 'S001', true),
('DSA_S06', 'S001', true)
ON CONFLICT (session_id, student_id) DO UPDATE SET present=true;

-- S002 (Borderline): 4/6 (66% - below 80%)
INSERT INTO attendance (session_id, student_id, present)
VALUES
('DSA_S01', 'S002', true),
('DSA_S02', 'S002', true),
('DSA_S03', 'S002', false),
('DSA_S04', 'S002', true),
('DSA_S05', 'S002', false),
('DSA_S06', 'S002', true)
ON CONFLICT (session_id, student_id) DO UPDATE SET present=EXCLUDED.present;

-- S003 (Low): 1/6
INSERT INTO attendance (session_id, student_id, present)
VALUES
('DSA_S01', 'S003', false),
('DSA_S02', 'S003', false),
('DSA_S03', 'S003', false),
('DSA_S04', 'S003', true),
('DSA_S05', 'S003', false),
('DSA_S06', 'S003', false)
ON CONFLICT (session_id, student_id) DO UPDATE SET present=EXCLUDED.present;

-- Ensure Start Students are enrolled in DSA101 (using new course_subjects logic would be ideal, but direct enrollment for analytics testing)
INSERT INTO enrollments (student_id, subject_id)
VALUES 
('S001', 'DSA101'),
('S002', 'DSA101'),
('S003', 'DSA101')
ON CONFLICT (student_id, subject_id) DO NOTHING;
