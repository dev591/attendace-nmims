-- EVENTS MODULE EXTENSION
-- Additive Only. No Drops.

CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    school TEXT NOT NULL,
    venue TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    budget_requested NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')) DEFAULT 'pending',
    created_by TEXT NOT NULL, -- SAPID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    audit_log JSONB DEFAULT '[]'::jsonb -- Stores history of changes/approvals
);

-- Requested Indexes
CREATE INDEX IF NOT EXISTS idx_events_date_status ON events(date, status);
CREATE INDEX IF NOT EXISTS idx_events_school ON events(school);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Analytics Queries Helper Index
CREATE INDEX IF NOT EXISTS idx_events_budget_agg ON events(status, budget_requested);
