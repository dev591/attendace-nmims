-- Fix Portfolio Schema (Missing Tables & Columns)

-- 1. Add missing columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS dream_company TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS career_goal TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS study_hours TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS github_url TEXT;

-- 2. Create student_skills table
CREATE TABLE IF NOT EXISTS student_skills (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id),
    skill_name TEXT NOT NULL,
    category TEXT DEFAULT 'Tech',
    endorsements INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, skill_name)
);

-- 3. Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id),
    title TEXT NOT NULL,
    provider TEXT,
    type TEXT, -- e.g. 'Course', 'Hackathon', 'Internship'
    date_completed DATE,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
