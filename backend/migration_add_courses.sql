-- Migration: Add Courses, Course Subjects, and Enrollments
-- Idempotent (Safe to run multiple times)

-- 1. Students Table Updates
ALTER TABLE students ADD COLUMN IF NOT EXISTS sapid TEXT UNIQUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS course_id TEXT;

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    course_id TEXT PRIMARY KEY,
    name TEXT,
    year INT,
    dept TEXT
);

-- 3. Subjects (Ensure exists)
CREATE TABLE IF NOT EXISTS subjects (
    subject_id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    credits INT DEFAULT 3
);

-- 4. Course Subjects Mapping
CREATE TABLE IF NOT EXISTS course_subjects (
    id SERIAL PRIMARY KEY,
    course_id TEXT REFERENCES courses(course_id),
    subject_id TEXT REFERENCES subjects(subject_id),
    faculty_name TEXT,
    section TEXT,
    UNIQUE(course_id, subject_id)
);

-- 5. Student Enrollments (Specific subjects for a student)
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id),
    subject_id TEXT REFERENCES subjects(subject_id),
    section TEXT,
    UNIQUE(student_id, subject_id)
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_subjects_course ON course_subjects(course_id);

-- 7. Sessions (Ensure exists with status)
-- Note: 'sessions' table assumed to exist from base schema. 
-- If modifying columns, use ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
