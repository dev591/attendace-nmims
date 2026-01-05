/* ADDED BY ANTI-GRAVITY */
CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    program TEXT NOT NULL, -- e.g., 'Engineering', 'MBA', 'Design', 'Law', 'General'
    text TEXT NOT NULL,
    author TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_quote_cache (
    date DATE NOT NULL,
    program TEXT NOT NULL,
    quote_id INT REFERENCES quotes(id),
    PRIMARY KEY (date, program)
);

-- Index for faster random retrieval by program
CREATE INDEX IF NOT EXISTS idx_quotes_program ON quotes(program);
