#!/bin/bash
# ADDED BY ANTI-GRAVITY

SAPID=${1:-50012023}
DATESTAMP=$(date +%s)
REPORT_DIR="backend/debug-reports"
REPORT_FILE="$REPORT_DIR/verify_${SAPID}_${DATESTAMP}.json"
BASE_URL="http://localhost:4000"

mkdir -p $REPORT_DIR

echo "🔍 Verifying SAPID: $SAPID"
echo "   Report: $REPORT_FILE"

# 1. Trigger Eval (Force recalc for testing)
echo "   > Triggering Badge Eval..."
curl -s -X POST "$BASE_URL/badges/evaluate" > /dev/null

# 2. Fetch Full Snapshot
echo "   > Fetching Student Snapshot..."
SNAPSHOT=$(curl -s "$BASE_URL/debug/full-student-snapshot/$SAPID")

# 3. Write to file
echo "$SNAPSHOT" | python3 -m json.tool > "$REPORT_FILE"

# 4. Parse simple summary for STDOUT
NAME=$(echo "$SNAPSHOT" | grep -A1 '"name":' | head -n1 | cut -d'"' -f4)
BADGES=$(echo "$SNAPSHOT" | grep '"name":' | grep -v "$NAME" | wc -l) # Rough count from json grep
ATT_ROWS=$(echo "$SNAPSHOT" | grep '"present":' | wc -l)

echo "✅ Verification Complete"
echo "   User: $NAME"
echo "   Attendance Rows: $ATT_ROWS"
echo "   Badges Awarded: $BADGES (approx)"
echo "   Full details in $REPORT_FILE"
