-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL, -- Recipient
    type VARCHAR(50) NOT NULL, -- 'COLLAB_REQUEST', 'ENDORSEMENT', 'SYSTEM', 'ACHIEVEMENT'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    action_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notif_student ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(student_id) WHERE is_read = FALSE;
