#!/bin/bash

API_URL="http://localhost:4000"

echo "🚀 Starting Verification (CURL)..."

# 1. Login Director
echo "1️⃣ Logging in as Director..."
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"sapid":"DIRECTOR", "password":"DS001"}')

TOKEN=$(echo $LOGIN_RESP | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Director Login Failed: $LOGIN_RESP"
  exit 1
fi

echo "✅ Director Logged In (Token received)"

# 2. Send Notification
TARGET_SAPID="590000004"
MSG="E2E_VERIFY_$(date +%s)"

echo "2️⃣ Sending Notification to $TARGET_SAPID..."
NOTIFY_RESP=$(curl -s -X POST "$API_URL/director/notify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"sapid\":\"$TARGET_SAPID\", \"message\":\"$MSG\", \"type\":\"success\"}")

echo "Notify Response: $NOTIFY_RESP"

# 3. Verify (Optional: Login as student and check)
# For now, if Notify returned success, we assume DB insert worked.
# We can verify by checking if we get a success: true
if [[ "$NOTIFY_RESP" == *"true"* ]]; then
  echo "✅ Notification Successfully Sent!"
else
  echo "❌ Notification Failed."
  exit 1
fi

echo "✅ Verification Script Passed."
