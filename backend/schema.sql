-- Antigravity Attendance Schema

DROP TABLE IF EXISTS student_badges;
DROP TABLE IF EXISTS student_skills;
DROP TABLE IF EXISTS student_projects;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS connections;
DROP TABLE IF EXISTS lost_items;
DROP TABLE IF EXISTS collab_requests;
DROP TABLE IF EXISTS endorsements;
DROP TABLE IF EXISTS ica_marks;
DROP TABLE IF EXISTS daily_tasks;
DROP TABLE IF EXISTS ai_response_cache;
DROP TABLE IF EXISTS awarded_badges;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS enrollment; -- Just in case typo
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS course_subjects;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS curriculum;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS settings;

CREATE TABLE courses (
    course_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    year INT,
    dept TEXT
);

CREATE TABLE students (
    student_id TEXT PRIMARY KEY,
    sapid TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    program TEXT,
    year INT,
    dept TEXT,
    course_id TEXT REFERENCES courses(course_id),
    semester INT DEFAULT 1, -- ADDED DEFAULT
    has_been_danger BOOLEAN DEFAULT FALSE,
    used_simulator BOOLEAN DEFAULT FALSE,
    must_set_password BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'student'
);

CREATE TABLE subjects (
    subject_id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    credits INT DEFAULT 3
);

CREATE TABLE curriculum (
    id SERIAL PRIMARY KEY,
    program TEXT,
    semester INT,
    year INT,
    subject_code TEXT,
    subject_name TEXT
);

-- ADDED ENROLLMENTS TABLE (Detected missing from original)
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id),
    subject_id TEXT REFERENCES subjects(subject_id),
    semester INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id)
);

CREATE TABLE course_subjects (
    id SERIAL PRIMARY KEY,
    course_id TEXT REFERENCES courses(course_id),
    subject_id TEXT REFERENCES subjects(subject_id),
    faculty_name TEXT,
    section TEXT,
    UNIQUE(course_id, subject_id)
);

CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES subjects(subject_id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    conducted_count INT DEFAULT 1
);

CREATE TABLE attendance (
    att_id SERIAL PRIMARY KEY,
    session_id TEXT REFERENCES sessions(session_id),
    student_id TEXT REFERENCES students(student_id),
    present BOOLEAN NOT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'manual',
    UNIQUE(session_id, student_id)
);

CREATE TABLE badges (
    badge_code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    criteria JSONB
);

CREATE TABLE student_badges (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id),
    badge_code TEXT REFERENCES badges(badge_code),
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, badge_code)
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_sessions_subject ON sessions(subject_id);
CREATE TABLE connections (
    id SERIAL PRIMARY KEY,
    requester_id TEXT REFERENCES students(student_id),
    receiver_id TEXT REFERENCES students(student_id),
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, receiver_id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id TEXT REFERENCES students(student_id),
    receiver_id TEXT REFERENCES students(student_id),
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_pair ON messages(sender_id, receiver_id);
CREATE TABLE lost_items (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id),
    item_name TEXT NOT NULL,
    description TEXT,
    location_lost TEXT,
    image_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, resolved
    security_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lost_items_status ON lost_items(status);
