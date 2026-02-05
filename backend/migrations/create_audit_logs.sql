-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL, -- 'APPEAL_UPDATE', 'ACHIEVEMENT_VERIFY', 'LOST_ITEM_RESOLVE'
    entity_id VARCHAR(50) NOT NULL,   -- ID of the item being changed (Cast to string for flexibility)
    entity_type VARCHAR(50) NOT NULL, -- 'appeal', 'achievement', 'lost_item'
    actor_id VARCHAR(50) NOT NULL,    -- Director ID or user ID who performed action
    actor_role VARCHAR(20) NOT NULL,  -- 'director', 'security', 'admin'
    changes JSONB,                    -- Store before/after or diff: { "status": { "old": "Pending", "new": "Approved" } }
    metadata JSONB DEFAULT '{}',      -- Extra context (e.g. security_note, points awarded)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for searching history of an entity
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
-- Index for timeline of an actor
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
