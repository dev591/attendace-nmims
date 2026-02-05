CREATE TABLE IF NOT EXISTS connections (
    id SERIAL PRIMARY KEY,
    requester_id TEXT REFERENCES students(student_id),
    receiver_id TEXT REFERENCES students(student_id),
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id TEXT REFERENCES students(student_id),
    receiver_id TEXT REFERENCES students(student_id),
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id);
