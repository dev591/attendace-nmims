# Database Schema (SQL-like)

```sql
-- Students Table
CREATE TABLE Students (
    student_id VARCHAR(20) PRIMARY KEY,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    program VARCHAR(50) NOT NULL, -- e.g., 'B.Tech CS-DS'
    year INTEGER NOT NULL,
    dept VARCHAR(50) NOT NULL, -- e.g., 'CS'
    profile_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects Table
CREATE TABLE Subjects (
    subject_id VARCHAR(20) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'DS101'
    name VARCHAR(100) NOT NULL,
    semester INTEGER NOT NULL,
    total_classes_T INTEGER NOT NULL, -- Planned total classes
    credits INTEGER NOT NULL
);

-- Sessions Table (A specific class instance)
CREATE TABLE Sessions (
    session_id VARCHAR(20) PRIMARY KEY,
    subject_id VARCHAR(20) REFERENCES Subjects(subject_id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(50), -- e.g., 'Room A'
    status ENUM('scheduled', 'conducted', 'cancelled') DEFAULT 'scheduled',
    created_by VARCHAR(50) -- Faculty ID or Admin ID
);

-- Attendance Table
CREATE TABLE Attendance (
    att_id SERIAL PRIMARY KEY,
    session_id VARCHAR(20) REFERENCES Sessions(session_id),
    student_id VARCHAR(20) REFERENCES Students(student_id),
    present BOOLEAN DEFAULT FALSE,
    marked_by VARCHAR(50), -- 'self_qr', 'faculty_manual', 'admin_upload'
    marked_at TIMESTAMP,
    UNIQUE(session_id, student_id)
);

-- Admin Actions Audit Log
CREATE TABLE AdminActions (
    action_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- e.g., 'publish_csv', 'approve_correction'
    payload JSONB, -- Stores the diff or details
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Global Settings
CREATE TABLE Settings (
    key VARCHAR(50) PRIMARY KEY, -- e.g., 'min_attendance_pct'
    value JSONB NOT NULL
);

-- Notifications
CREATE TABLE Notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES Students(student_id), -- or Generic User ID
    title VARCHAR(100) NOT NULL,
    body TEXT,
    type ENUM('INFO', 'WARNING', 'DANGER', 'ADMIN') NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Correction Requests (implied from requirements)
CREATE TABLE CorrectionRequests (
    request_id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES Students(student_id),
    session_id VARCHAR(20) REFERENCES Sessions(session_id),
    reason TEXT,
    proof_url VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_by VARCHAR(50),
    resolved_at TIMESTAMP
);
```
