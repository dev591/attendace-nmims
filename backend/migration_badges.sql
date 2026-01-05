/* ADDED BY ANTI-GRAVITY */
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  badge_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB NOT NULL,
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_badges (
  id SERIAL PRIMARY KEY,
  student_id TEXT REFERENCES students(student_id) ON DELETE CASCADE,
  badge_id INT REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP DEFAULT NOW(),
  meta JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_badges_key ON badges(badge_key);
