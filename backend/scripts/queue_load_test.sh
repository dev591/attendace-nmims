#!/bin/bash
echo "🚀 Starting Load Test (50 Jobs)..."

for i in {1..50}
do
   curl -s -X POST http://localhost:4000/queue/trigger-analytics \
   -H "Content-Type: application/json" \
   -d "{\"studentId\": \"S00$i\"}" > /dev/null &
done

echo "✅ 50 Jobs fired."
wait
echo "Load Test Complete."
