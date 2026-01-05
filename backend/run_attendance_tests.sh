#!/bin/bash
# backend/run_attendance_tests.sh

echo "Running Attendance Analytics API Tests..."
mkdir -p debug-reports

# 1. Login as S001 (Seed student using seeded credentials if possible, or just seed new creds in migration if needed)
# Actually, the seed didn't set password for S001 explicitly in this run, but previous seeds might have.
# Let's assume we can get a token for 50012023 (Seed Student) if it exists, or we skip auth check for debug loop?
# No, endpoints are protected.
# We need to ensure we can login.
# Let's try to login as the 'Seed Student' (SAPID 50012023, Pass password123) which exists from previous tasks.

echo "Login..."
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"sapid": "50012023", "password": "password123"}' | node -e 'try { console.log(JSON.parse(require("fs").readFileSync(0, "utf-8")).token) } catch(e) {}')


if [ -z "$TOKEN" ]; then
  echo "❌ Login Failed. Cannot proceed."
  exit 1
fi

echo "✅ Token obtained."

# 2. Test Specific Subject Analytics (DSA101)
echo "Testing /attendance-analytics for DSA101..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/student/S001/subject/DSA101/attendance-analytics" > debug-reports/attendance_dsa_s001.json

# Check output content
if grep -q "max_allowed_absent" debug-reports/attendance_dsa_s001.json; then
    echo "✅ DSA101 Analytics JSON received."
else
    echo "❌ DSA101 Analytics Failed. Response saved to debug-reports/attendance_dsa_s001.json"
    cat debug-reports/attendance_dsa_s001.json
    exit 1
fi

# 3. Test Overview
echo "Testing /attendance-overview..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/student/S001/attendance-overview" > debug-reports/attendance_overview_s001.json

if grep -q "DSA101" debug-reports/attendance_overview_s001.json; then
    echo "✅ Overview JSON received."
else
    echo "❌ Overview Failed."
    exit 1
fi

echo "All Backend Tests Passed!"
