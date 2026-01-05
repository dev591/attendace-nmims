-- ADDED BY ANTI-GRAVITY
-- Standard Badges

INSERT INTO badges (id, title, description, rule_json) VALUES
('b_first_step', 'First Step', 'Attend your first session', '{"type": "first_steps"}'),
('b_on_fire', 'On Fire', '7-day Attendance Streak', '{"type": "streak", "threshold": 7}'),
('b_perfect_attendance', 'Perfect', '100% Attendance Rate', '{"type": "attendance", "threshold": 100}'),
('b_ scholar', 'Scholar', 'Maintain >90% Attendance', '{"type": "attendance", "threshold": 90}')
ON CONFLICT (id) DO NOTHING;

-- Initial Quotes
INSERT INTO daily_quote_cache (date, program, quote_id) VALUES
(CURRENT_DATE, 'engineering', 1)
ON CONFLICT DO NOTHING;
