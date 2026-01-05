-- ADDED BY ANTI-GRAVITY

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  program TEXT,             -- scope: engineering/pharma/...
  rule_json JSONB NOT NULL, -- machine-readable rule (type: streak/attendance/days)
  icon TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS awarded_badges (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

CREATE TABLE IF NOT EXISTS daily_quote_cache (
  date DATE NOT NULL,
  program TEXT NOT NULL,
  quote_id INT NOT NULL,
  PRIMARY KEY (date, program)
);

CREATE TABLE IF NOT EXISTS student_snapshots (
  sapid TEXT PRIMARY KEY,
  snapshot JSONB,
  updated_at TIMESTAMP DEFAULT now()
);
