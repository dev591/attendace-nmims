-- Change study_hours to TEXT to support string ranges like "1-2 hours"
ALTER TABLE students ALTER COLUMN study_hours TYPE TEXT USING study_hours::TEXT;
