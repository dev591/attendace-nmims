
import { getClassesTabSnapshot } from './lib/subject_details.js';
import { getClient } from './db.js';

async function verify() {
    const client = await getClient();
    try {
        console.log("=== Verifying Timetable API Logic ===");
        const STUDENT_ID = 'SS9000000'; // Our test user

        const data = await getClassesTabSnapshot(STUDENT_ID);

        console.log("\n--- Meta ---");
        console.log(data.meta);

        console.log("\n--- Timetable Payload ---");
        if (data.timetable && data.timetable.length > 0) {
            data.timetable.forEach(group => {
                console.log(`\n📅 [${group.date}] ${group.label}`);
                group.sessions.forEach(s => {
                    console.log(`   ${s.start_time}-${s.end_time} | ${s.type} | ${s.status} | ${s.subject_name}`);
                });
            });
        } else {
            console.log("TIMETABLE EMPTY");
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

verify();
