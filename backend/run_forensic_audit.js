
import http from 'http';

const SAPID = 'S90030770';

console.log(`🕵️‍♀️ STARTING FORENSIC AUDIT FOR ${SAPID}...`);

const req = http.get(`http://localhost:4000/__debug/student/${SAPID}/full-dump`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("\n--- FORENSIC REPORT ---");
            if (json.success) {
                console.log("✅ STATUS: HEALTHY");
            } else {
                console.log("❌ STATUS: FAILED");
                console.log(`Error: ${json.error}`);
            }

            console.log("\n--- LOGS ---");
            json.logs.forEach(l => {
                console.log(`[${l.message}]`);
                if (l.data) console.dir(l.data, { depth: null, colors: true });
            });

        } catch (e) {
            console.log("RAW RESPONSE:", data);
        }
    });
});

req.on('error', (e) => {
    console.error("❌ CONNECTION ERROR:", e.message);
    console.log("Is the server running?");
});
