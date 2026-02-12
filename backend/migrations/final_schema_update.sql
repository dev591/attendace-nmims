-- Fix missing columns in students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS joining_year INT;

-- Create ica_marks table
CREATE TABLE IF NOT EXISTS ica_marks (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id),
    subject_code TEXT,
    test_name TEXT,
    marks_obtained NUMERIC(5,2),
    total_marks NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create student_projects table
CREATE TABLE IF NOT EXISTS student_projects (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id),
    title TEXT NOT NULL,
    description TEXT,
    link TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
