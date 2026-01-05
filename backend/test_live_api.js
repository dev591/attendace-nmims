
import http from 'http';

function testLive() {
    console.log("📡 TESTING LIVE SERVER API (http://localhost:4000)...");

    // SAPID from the user's screenshot/context
    const sapid = '90030770';

    const options = {
        hostname: 'localhost',
        port: 4000,
        path: `/student/${sapid}/snapshot`,
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        console.log(`STATUS: ${res.statusCode}`);

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.subjects) {
                    console.log(`\n📦 LIVE SERVER RESPONSE:`);
                    console.log(`   Student: ${json.student.name} (${json.student.program})`);
                    console.log(`   Subjects Count: ${json.subjects.length}`);

                    if (json.subjects.length > 0) {
                        console.log("✅ LIVE SERVER IS WORKING! Subjects are being returned.");
                        json.subjects.forEach(s => console.log(`   - [${s.subject_code}] ${s.subject_name}`));
                    } else {
                        console.log("❌ LIVE SERVER RETURNED 0 SUBJECTS.");
                        console.log("   (This means the server is running OLD CODE or the DB is truly empty for this logic)");
                    }
                } else {
                    console.log("❌ INVALID RESPONSE STRUCTURE:", Object.keys(json));
                }
            } catch (e) {
                console.log("❌ FAILED TO PARSE JSON:", data.substring(0, 100));
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ CONNECTION FAILED: ${e.message}`);
        console.log("   (Is the server running on port 4000?)");
    });

    req.end();
}

testLive();
