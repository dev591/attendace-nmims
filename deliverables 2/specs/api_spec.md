# API Specification (RESTful)

## 1. Authentication

### POST /auth/login
**Request:**
```json
{
  "email": "dev@nmims.edu",
  "otp": "123456" 
  // OR "provider": "google", "id_token": "..."
}
```
**Response:**
```json
{
  "token": "jwt_ey...",
  "role": "student", // or "faculty", "admin"
  "student_id": "S001",
  "name": "Dev Chalana",
  "profile_url": "..."
}
```

## 2. Student Endpoints

### GET /student/{id}/dashboard
**Response:**
```json
{
  "student_id": "S001",
  "overall_pct": 78.5,
  "subjects": [
    {
      "subject_id": "SUB01",
      "name": "Data Structures",
      "code": "DS101",
      "T": 45,
      "C": 20,
      "A": 15,
      "current_pct": 75.0,
      "needed_from_remaining": 21,
      "max_misses": 4,
      "status_color": "yellow" // computed for UI
    },
    {
      "subject_id": "SUB02",
      "name": "Algorithms",
      "current_pct": 90.0,
      "status_color": "green"
    }
  ]
}
```

### GET /student/{id}/subject/{subject_id}
**Response:**
```json
{
  "subject_details": { "name": "Data Structures", "code": "DS101" },
  "sessions": [
    {
      "session_id": "SE001",
      "date": "2025-12-01",
      "start_time": "09:00",
      "status": "conducted",
      "present": true,
      "location": "Room A"
    },
    {
      "session_id": "SE002",
      "date": "2025-12-03",
      "status": "cancelled",
      "present": null
    }
  ]
}
```

### POST /student/{id}/correction_request
**Request:**
```json
{
  "session_id": "SE005",
  "reason": "Medical emergency",
  "proof_url": "https://s3..."
}
```
**Response:**
```json
{ "request_id": 101, "status": "pending" }
```

## 3. Faculty Endpoints

### GET /faculty/classes
Returns list of subjects/sessions managed by faculty.

### POST /faculty/{faculty_id}/session/{session_id}/mark
**Request:**
```json
{
  "marks": [
    { "student_id": "S001", "present": true },
    { "student_id": "S002", "present": false }
  ]
}
```

### POST /faculty/session/{session_id}/qrcode
**Response:**
```json
{ "token": "rotating_token_xyz_123", "expiry_seconds": 30 }
```

## 4. Admin Endpoints

### POST /admin/upload/{type}
`type` can be `students`, `subjects`, `sessions`, `attendance`.
**Request:** `multipart/form-data` with `.csv` file.
**Response:**
```json
{
  "preview_changes_id": "tmp_preview_123",
  "summary": {
    "rows_parsed": 50,
    "new_records": 48,
    "validation_errors": 2
  },
  "preview_data": [...]
}
```

### POST /admin/publish/{preview_changes_id}
**Response:**
```json
{ "status": "published", "records_committed": 48 }
```

### GET /admin/analytics
**Query Params:** `dept=CS`, `semester=3`
**Response:**
```json
{
  "dept_summary": { "avg_attendance": 82.5, "students_at_risk": 5 },
  "subject_stats": [
    { "code": "DS101", "avg": 75.0, "below_threshold_count": 10 }
  ]
}
```

## 5. AI/Features (Premium)

### POST /ml/predict-risk
**Request:** `{ "student_id": "S001", "subject_id": "SUB01" }`
**Response:**
```json
{
  "risk_score": 0.85, // High risk
  "recommended_actions": [
    "Attend next 3 classes mandatorily",
    "Meet Prof. X"
  ]
}
```
