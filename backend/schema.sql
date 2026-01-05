-- Antigravity Attendance Schema

DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS course_subjects;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS students;
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
    course_id TEXT REFERENCES courses(course_id)
);

CREATE TABLE subjects (
    subject_id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    credits INT DEFAULT 3
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
    status TEXT NOT NULL DEFAULT 'scheduled'
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

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_sessions_subject ON sessions(subject_id);
CREATE INDEX idx_course_subjects_course ON course_subjects(course_id);
