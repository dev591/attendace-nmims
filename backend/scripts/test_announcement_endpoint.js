
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

// Mock Director Token
const token = jwt.sign(
    {
        student_id: 'DIRECTOR_TEST',
        sapid: 'DIRECTOR',
        role: 'director',
        dept: 'STME'
    },
    JWT_SECRET
);

const testAnnouncement = async () => {
    try {
        console.log("Testing POST /director/announcements...");
        const res = await fetch(`${API_URL}/director/announcements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: 'Test Announcement Script',
                message: 'This is a test message from the verification script.',
                target_group: 'all',
                target_value: ''
            })
        });

        const json = await res.json();
        console.log("Response Status:", res.status);
        console.log("Response Body:", json);

        if (res.ok) {
            console.log("✅ Announcement Endpoint Success");
        } else {
            console.error("❌ Announcement Endpoint Failed");
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
};

testAnnouncement();
