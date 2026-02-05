CREATE TABLE lost_items (
    id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id),
    item_name TEXT NOT NULL,
    description TEXT,
    location_lost TEXT,
    image_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, resolved
    security_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lost_items_status ON lost_items(status);
