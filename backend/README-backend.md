
# Antigravity Backend (Extended)

This backend supports **SAPID Authentication**, **Course Selection**, and **Bulk CSV Imports**.

## 🚀 Setup

1. **Start Database**
   ```bash
   docker-compose up -d
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Import Data (Bulk)**
   This script runs migrations and imports data from `csv_templates/`.
   ```bash
   node import_bulk.js
   ```
   *Note: If you want to use the seed data instead, run `npm run seed`.*

4. **Start Server**
   ```bash
   npm start
   ```

## 🔑 Login Credentials (from samples)

**Option 1: Seed Data (if ran npm run seed)**
- SAPID: `50012023`
- Pass: `password123`

**Option 2: Bulk Import (csv_templates/students.csv)**
- SAPID: `70012023`
- Pass: (Empty in CSV) -> You must call `/auth/set-password` or manually set hash.
- *Test Tip:* Add a known hash to `students.csv` or use the API to set password.

## 🔌 Frontend Integration
Helper files are located in `../frontend-integration/` (at project root).
- `api-client.js`: Use this in your React app to call the new API.
- `demo-snippet.md`: Reference for login flow implementation.

## 📡 New Endpoints
- `POST /auth/set-password`: `{ sapid, password }`
- `POST /student/set-course`: `{ course_id }`
- `GET /courses`: List all courses.
- `POST /import/attendance-csv`: `{ filePath }`
- **DB Connection Error**: Wait 10s for Docker to initialize fully.
- **Import Conflicts**: The scripts use `ON CONFLICT DO NOTHING/UPDATE`, so you can re-run them safely.

# Attendance Analytics Engine (Backend)

## Features
- **Real-time Stats**: Calculates attendance percentage, sessions conducted, and sessions attended.
- **Risk Assessment**: Classifies student status as Low, Moderate, or High risk based on the 80% threshold.
- **Predictions**: Forecasts attendance percentage if the next class is attended or missed.
- **Safe Misses**: potential for skipping classes without dropping below the threshold.

## API Endpoints

### 1. Get Subject Analytics
- **GET** `/student/:id/subject/:subId/attendance-analytics`
- **Auth**: Bearer Token
- **Response**:
```json
{
  "subject_id": "DSA101",
  "subject_name": "Data Structures",
  "total_planned": 45,
  "conducted": 6,
  "attended": 6,
  "percentage": 100,
  "max_allowed_absent": 9,
  "absent_so_far": 0,
  "absent_left": 9,
  "risk_level": "low",
  "skip_next": { "attend": 100, "miss": 85.71 }
}
```

### 2. Get Analytics Overview
- **GET** `/student/:id/attendance-overview`
- **Auth**: Bearer Token
- **Response**: Array of analytics objects (as above) for all enrolled subjects.

## Setup & Testing
1. **Migration**: Run `node backend/apply_analytics_migration.js` (Run from project root if needed, or `cd backend && node apply_analytics_migration.js`).
2. **Tests**: Run `backend/run_attendance_tests.sh`.

## Implementation Details
- **Logic**: See `backend/attendance_analytics.js`.
- **Database**: Adds `total_classes`, `min_attendance_pct` to `subjects` table.
