/* ADDED BY ANTI-GRAVITY */
-- Migration: Add fields to subjects table for analytics
-- Idempotent: Using DO block to check for column existence

DO $$
BEGIN
    -- Add total_classes if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='total_classes') THEN
        ALTER TABLE subjects ADD COLUMN total_classes INT DEFAULT 45;
    END IF;

    -- Add min_attendance_pct if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='min_attendance_pct') THEN
        ALTER TABLE subjects ADD COLUMN min_attendance_pct INT DEFAULT 80;
    END IF;
END $$;

-- Add index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_subjects_analytics ON subjects(total_classes, min_attendance_pct);
