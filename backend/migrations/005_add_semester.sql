-- Add semester column to students and curriculum
ALTER TABLE students ADD COLUMN IF NOT EXISTS semester INT DEFAULT 1;
ALTER TABLE curriculum ADD COLUMN IF NOT EXISTS semester INT DEFAULT 1;

-- Update unique constraint on curriculum to include semester
ALTER TABLE curriculum DROP CONSTRAINT IF EXISTS curriculum_program_year_subject_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_curriculum_unique ON curriculum (program, year, semester, subject_code);
