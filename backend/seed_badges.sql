/* ADDED BY ANTI-GRAVITY */
INSERT INTO badges (badge_key,name,description,icon,criteria) VALUES
('first_steps','First Steps','Attend 3 classes in a row (any subject).','/assets/badges/first_steps.svg', '{"type":"streak","days":3}'),
('committed_week','Committed (7-day streak)','Attend 7 classes in a row.','/assets/badges/committed_week.svg', '{"type":"streak","days":7}'),
('perfect_week','Perfect Week','Attend all scheduled classes in a calendar week.','/assets/badges/perfect_week.svg', '{"type":"perfect_week","week_days":7}'),
('subject_regular_dsa','DSA Regular','Maintain >=80% in Data Structures (DSA101).','/assets/badges/subject_regular.svg', '{"type":"subject_pct","subject_id":"DSA101","pct":80}'),
('overall_consistent','Consistent Performer','Maintain >=85% overall attendance.','/assets/badges/overall_consistent.svg', '{"type":"overall_pct","pct":85}'),
('top_attender','Semester Master','Achieve >=95% by semester end.','/assets/badges/top_attender.svg', '{"type":"semester_pct","pct":95}'),
('first_correction','Careful: Correction','First accepted correction request.','/assets/badges/first_correction.svg', '{"type":"event","event_name":"correction_approved"}'),
('social_butterfly','Social Learner','Attend 5 different subjects in sequence.','/assets/badges/social_butterfly.svg', '{"type":"cross_subject_sequence","count":5}')
ON CONFLICT (badge_key) DO NOTHING;
