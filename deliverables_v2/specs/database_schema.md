# Database Schema (Read-Only Student Dashboard)

This schema represents the data structure imported from the official university ERP. The app has **READ-ONLY** access to these tables.

```sql
-- Students Table ( synced )
CREATE TABLE Students (
    student_id VARCHAR(20) PRIMARY KEY,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    program VARCHAR(50) NOT NULL, -- e.g., 'B.Tech CS-DS'
    year INTEGER NOT NULL,
    dept VARCHAR(50) NOT NULL,
    profile_url VARCHAR(255)
);

-- Subjects Table ( synced )
CREATE TABLE Subjects (
    subject_id VARCHAR(20) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    semester INTEGER NOT NULL,
    total_classes_T INTEGER NOT NULL -- Planned total classes for the term
);

-- Sessions Table ( synced )
-- Represents every scheduled class in the timetable
CREATE TABLE Sessions (
    session_id VARCHAR(20) PRIMARY KEY,
    subject_id VARCHAR(20) REFERENCES Subjects(subject_id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('scheduled', 'conducted', 'cancelled')
);

-- Attendance Table ( synced )
-- Contains only records for conducted sessions
CREATE TABLE Attendance (
    att_id SERIAL PRIMARY KEY,
    session_id VARCHAR(20) REFERENCES Sessions(session_id),
    student_id VARCHAR(20) REFERENCES Students(student_id),
    present BOOLEAN NOT NULL,
    marked_at TIMESTAMP -- When it was captured by the official system
);

-- Settings / Metadata
CREATE TABLE Settings (
    key VARCHAR(50) PRIMARY KEY, -- e.g. 'last_sync_timestamp'
    value JSONB
);
```

## Data Flow Notes
1.  **Sync Frequency**: Nightly batch job via CSV export from ERP.
2.  **Permissions**:
    *   `App` -> `SELECT` only.
    *   `ERP` -> Full Control.
