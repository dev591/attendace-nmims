
-- FINAL LAUNCH FIX MIGRATION

-- 1. Apply Director Launch Changes (Columns)
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS joining_year INT;

-- 2. Create ICA Marks
CREATE TABLE IF NOT EXISTS ica_marks (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id) ON DELETE CASCADE,
    subject_code TEXT NOT NULL,
    test_name TEXT NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    total_marks DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_code, test_name)
);

-- 3. Create Enrollments (Missing Critical Table)
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    semester INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id)
);

-- 4. Create Notifications (Missing Critical Table)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

-- 5. Create Announcements (If missing)
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_group TEXT, -- e.g. 'all', 'school', 'student'
    target_value TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Student Projects (If missing)
CREATE TABLE IF NOT EXISTS student_projects (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link TEXT,
    status TEXT DEFAULT 'Pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
