#!/bin/bash
# backend/run_token_audit.sh

mkdir -p debug-reports

# 1. Start by waiting for server (assume running or restart if needed)
# For this script we assume server is running on localhost:4000
echo "Starting Audit..."

# 2. Test Cases
# A) Valid (using seed)
echo "Test A: Valid Login"
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"sapid": "50012023", "password": "password123"}' > debug-reports/resp_valid.json
echo ""

# B) Random (99999999)
echo "Test B: Random Login 1"
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"sapid": "99999999", "password": "abc"}' > debug-reports/resp_random1.json
echo ""

# C) Random (80012023)
echo "Test C: Random Login 2"
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"sapid": "80012023", "password": "xyz"}' > debug-reports/resp_random2.json
echo ""

# 3. Analyze
echo "Analyzing..."
FAILED=false

# Check if random responses have token
if grep -q "token" debug-reports/resp_random1.json; then
  echo "FAIL: Random 1 got a token!"
  FAILED=true
fi
if grep -q "token" debug-reports/resp_random2.json; then
  echo "FAIL: Random 2 got a token!"
  FAILED=true
fi

# Create Summary JSON
echo "{\"audit_failed\": $FAILED, \"timestamp\": \"$(date)\"}" > debug-reports/audit_responses.json

if [ "$FAILED" = true ]; then
  echo "AUDIT FAILED: TOKENS ISSUED TO RANDOM USERS"
else
  echo "AUDIT PASSED: No tokens for random users."
fi
