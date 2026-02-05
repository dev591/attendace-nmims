-- Security Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'Low', -- Low, Medium, High, Critical
    status VARCHAR(20) DEFAULT 'Open', -- Open, In Progress, Resolved, Closed
    reported_by VARCHAR(50), -- SAPID
    assigned_to VARCHAR(50), -- Admin/Director SAPID
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit log integration?
-- When incident is resolved, log to audit_logs? Yes (in backend logic).
