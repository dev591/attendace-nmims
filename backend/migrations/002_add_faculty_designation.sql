
-- Add designation column for faculty
ALTER TABLE students ADD COLUMN IF NOT EXISTS designation TEXT;

-- Index for faster faculty lookups
CREATE INDEX IF NOT EXISTS idx_students_role ON students(role);
