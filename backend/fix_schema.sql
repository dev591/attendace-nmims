-- Add has_been_danger to students if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS has_been_danger BOOLEAN DEFAULT FALSE;

-- Create curriculum table if it doesn't exist
CREATE TABLE IF NOT EXISTS curriculum (
    id SERIAL PRIMARY KEY,
    program TEXT NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    subject_code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program, year, semester, subject_code)
);

-- Index for faster lookups during auto-enrollment
CREATE INDEX IF NOT EXISTS idx_curriculum_lookup ON curriculum(program, year, semester);
