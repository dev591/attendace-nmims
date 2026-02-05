-- Add event_type column for analytics
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'General';
-- Add index for grouping
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
