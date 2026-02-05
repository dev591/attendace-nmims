
-- Migration: Fix Sessions Table Schema
-- Description: Adds missing 'type' column and ensures 'location' usage.

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Lecture';

-- Note: We are sticking with 'location' as the column name for room/location as per existing schema.
-- No rename needed if valid logic uses 'location'.
