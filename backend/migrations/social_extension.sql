-- Social Features Migration
CREATE TABLE IF NOT EXISTS posts (
    post_id SERIAL PRIMARY KEY,
    student_id TEXT REFERENCES students(student_id),
    content TEXT,
    image_url TEXT,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(post_id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(student_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, student_id)
);

-- Index for faster feed retrieval
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
