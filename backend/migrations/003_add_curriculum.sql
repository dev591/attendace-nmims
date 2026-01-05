CREATE TABLE IF NOT EXISTS curriculum (
    id SERIAL PRIMARY KEY,
    program TEXT NOT NULL,
    year INT NOT NULL,
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    total_classes INT NOT NULL DEFAULT 40,
    min_attendance_pct INT NOT NULL DEFAULT 80,
    UNIQUE(program, year, subject_code)
);
