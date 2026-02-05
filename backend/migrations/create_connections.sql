-- Endorsements: Peer validation for skills
CREATE TABLE IF NOT EXISTS endorsements (
    endorsement_id SERIAL PRIMARY KEY,
    skill_id INTEGER REFERENCES student_skills(id) ON DELETE CASCADE,
    from_student_id INTEGER REFERENCES students(student_id),
    to_student_id INTEGER REFERENCES students(student_id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(skill_id, from_student_id) -- One endorsement per skill per peer
);

-- Collab Requests: "Looking for Teammate"
CREATE TABLE IF NOT EXISTS collab_requests (
    request_id SERIAL PRIMARY KEY,
    from_student_id INTEGER REFERENCES students(student_id),
    to_student_id INTEGER REFERENCES students(student_id),
    project_idea TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexing for speed
CREATE INDEX idx_endorse_to ON endorsements(to_student_id);
CREATE INDEX idx_collab_to ON collab_requests(to_student_id);
