-- DIRECTOR DASHBOARD LAUNCH MIGRATION

-- 1. Contact Info for Students
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS joining_year INT;

-- 2. ICA Marks (Test Scores)
CREATE TABLE IF NOT EXISTS ica_marks (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id) ON DELETE CASCADE,
    subject_code TEXT NOT NULL,
    test_name TEXT NOT NULL, -- e.g. 'Test 1', 'Test 2', 'Mid Term'
    marks_obtained DECIMAL(5,2) NOT NULL,
    total_marks DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_code, test_name)
);

CREATE INDEX IF NOT EXISTS idx_ica_student ON ica_marks(student_id);

-- 3. Student Projects
CREATE TABLE IF NOT EXISTS student_projects (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link TEXT, -- GitHub or Drive URL
    status TEXT DEFAULT 'Pending', -- 'Verified', 'Pending', 'Rejected'
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_student ON student_projects(student_id);

-- 4. Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_config JSONB NOT NULL DEFAULT '{}', -- e.g. { "scope": "school", "value": "STME" }
    created_by TEXT, -- SAPID of Director/Admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Helper Function for Announcments (Optional, used by backend logic)
-- No trigger needed for now, handled by application logic.
