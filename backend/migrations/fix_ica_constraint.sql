ALTER TABLE ica_marks ADD CONSTRAINT ica_marks_unique_entry UNIQUE (student_id, subject_code, test_name);
