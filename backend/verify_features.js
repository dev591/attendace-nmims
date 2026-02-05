
import { query } from './db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_BASE = 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

const log = (msg, type = 'info') => {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
    console.log(`${icons[type] || ''} ${msg}`);
};

async function runTests() {
    log("Starting System Verification...", 'info');
    let allPassed = true;

    try {
        // --- PREP: Get a Random Student ---
        const studentRes = await query("SELECT sapid, student_id FROM students WHERE role='student' LIMIT 1");
        if (studentRes.rows.length === 0) throw new Error("No students found in DB to test with.");
        const randomStudent = studentRes.rows[0];
        log(`Target Student: ${randomStudent.sapid}`, 'info');

        // --- 1. EVENT PERMISSIONS ---
        log("\n--- TEST PHASE 1: Event Permissions ---", 'info');

        // 1.1 Login as Event Coordinator
        const ecToken = jwt.sign({
            id: 'EVENT_COORD', sapid: 'EVENT_COORD', role: 'event_coordinator'
        }, JWT_SECRET);

        // 1.2 Create Event
        const newEvent = {
            title: `Test Event ${Date.now()}`,
            school: 'MPSTME',
            venue: `Main Hall ${Date.now()}`,
            description: 'Automated Test Event',
            date: '2026-12-31', // Future date
            start_time: '10:00:00',
            end_time: '12:00:00',
            budget_requested: 5000
        };

        log("Creating Event as Event Coordinator...", 'info');
        const createRes = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ecToken}` },
            body: JSON.stringify(newEvent)
        });

        if (!createRes.ok) throw new Error(`Failed to create event: ${createRes.statusText}`);
        const eventData = await createRes.json();
        const eventId = eventData.event_id;

        if (eventData.status !== 'pending') {
            log(`Event status is ${eventData.status}, expected 'pending'`, 'error');
            allPassed = false;
        } else {
            log("Event created successfully as Pending.", 'success');
        }

        // 1.3 Attempt Unauthorized Approval (as Event Coordinator)
        log("Attempting Unauthorized Approval (as Event Coordinator)...", 'info');
        const unauthRes = await fetch(`${API_BASE}/events/${eventId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ecToken}` },
            body: JSON.stringify({ status: 'approved' })
        });

        if (unauthRes.status === 403) {
            log("Unauthorized approval blocked correctly (403).", 'success');
        } else {
            log(`Security Breach! Event Coordinator could approve event. Status: ${unauthRes.status}`, 'error');
            allPassed = false;
        }

        // 1.4 Approve as Director
        log("Approving Event as Director...", 'info');
        const dirToken = jwt.sign({
            id: 'DIRECTOR', sapid: 'DIRECTOR', role: 'director'
        }, JWT_SECRET);

        const authRes = await fetch(`${API_BASE}/events/${eventId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dirToken}` },
            body: JSON.stringify({ status: 'approved', feedback: 'Looks good' })
        });

        if (authRes.ok) {
            const upEvent = await authRes.json();
            if (upEvent.status === 'approved') {
                log("Director approved event successfully.", 'success');
            } else {
                log("Director approval failed to update status.", 'error');
                allPassed = false;
            }
        } else {
            log(`Director approval failed with ${authRes.status}`, 'error');
            allPassed = false;
        }


        // --- 2. ANNOUNCEMENTS ---
        log("\n--- TEST PHASE 2: Announcements ---", 'info');

        const annTitle = `Welcome ${randomStudent.sapid}`;
        const annMsg = "This is a targeted test announcement.";

        log(`Sending Announcement to Student ${randomStudent.sapid}...`, 'info');
        const annRes = await fetch(`${API_BASE}/director/announcements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dirToken}` },
            body: JSON.stringify({
                title: annTitle,
                message: annMsg,
                target_group: 'student',
                target_value: randomStudent.sapid
            })
        });

        if (annRes.ok) {
            log("Announcement POST request successful.", 'success');
        } else {
            log(`Announcement POST failed: ${annRes.status}`, 'error');
            allPassed = false;
        }

        // Verify in DB (Notifications logic usually creates a notification entry or client pulls from announcements table)
        // Check 'announcements' table
        // Note: target_config is stored as JSON, target_value is inside it.
        const dbAnnCheck = await query("SELECT * FROM announcements WHERE title = $1", [annTitle]);

        let found = false;
        if (dbAnnCheck.rows.length > 0) {
            const row = dbAnnCheck.rows[0];
            // Check columns matching API insert
            if (row.target_value === randomStudent.sapid && row.target_group === 'student') {
                found = true;
            } else {
                log(`Announcement found but config mismatch: Group=${row.target_group}, Value=${row.target_value}`, 'warn');
            }
        } else {
            log(`Announcement not found in DB by title.`, 'error');
        }

        if (found) {
            log("Announcement verified in Database.", 'success');
        } else {
            log("Announcement NOT found in Database or config mismatch!", 'error');

            // DEBUG: Dump all announcements
            const allAnn = await query("SELECT * FROM announcements ORDER BY created_at DESC LIMIT 5");
            console.log("DEBUG: Last 5 announcements in DB:", JSON.stringify(allAnn.rows, null, 2));

            allPassed = false;
        }


        // --- SUMMARY ---
        log("\n--- VERIFICATION SUMMARY ---", 'info');
        if (allPassed) {
            log("SYSTEM IS READY FOR REAL USERS", 'success');
        } else {
            log("System Verification FAILED. Check logs above.", 'error');
        }

        process.exit(allPassed ? 0 : 1);

    } catch (e) {
        log(`CRITICAL ERROR: ${e.message}`, 'error');
        console.error(e);
        process.exit(1);
    }
}

runTests();
