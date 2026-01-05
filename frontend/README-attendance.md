# Attendance Analytics Engine (Frontend)

## Overview
This feature provides real-time attendance analytics, risk assessment, and "safe miss" calculations based on backend data.

## Components
- **`AttendanceOverviewCard`**: Visual summary of a subject's attendance status.
- **`MissCalculator`**: Interactive tool to simulate future attendance outcomes.
- **`SubjectListWithAnalytics`**: Container for displaying all enrolled subjects.
- **`DebugAnalytics`**: A self-contained debugger component that fetches and displays real data from the backend.

## Integration
The `DebugAnalytics` component is currently embedded at the bottom of the `StudentDashboard` for testing purposes.

## Verification Steps
1. **Login**: Use a valid student account (e.g., `50012023` / `password123` or your seeded user).
2. **Navigate**: Go to the **Student Dashboard**.
3. **Scroll Down**: Look for the "DEV MODE" section at the bottom.
4. **Check Data**:
   - You should see cards for subjects like "DSA101".
   - Verify the percentage matches the backend test data (e.g., S001 should be 100% or similar based on seed).
   - Click a card to open the **Miss Calculator**.
   - Drag the slider to see how missing future classes impacts the percentage.

## Troubleshooting
- If the section says "Error loading analytics", check:
  - Is the backend running? (`npm start` in `backend/`)
  - Is your token valid? (Try logout/login)
  - Check browser console for network errors (403/404).
