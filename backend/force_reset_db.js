
import { query } from './db.js';

const dropTables = [
    'lost_items', 'messages', 'connections', 'attendance', 'enrollments', 'enrollment',
    'student_badges', 'student_skills', 'student_projects', 'achievements',
    'notifications', 'awarded_badges', 'collab_requests', 'endorsements',
    'daily_tasks', 'ai_response_cache', 'ica_marks', 'announcements',
    'sessions', 'course_subjects', 'students', 'curriculum', 'badges',
    'subjects', 'courses', 'settings'
];

const reset = async () => {
    console.log("🔥 Force Resetting DB...");
    for (const t of dropTables) {
        try {
            await query(`DROP TABLE IF EXISTS ${t} CASCADE`);
            console.log(`✅ Dropped ${t}`);
        } catch (e) {
            console.error(`❌ Failed to drop ${t}`, e);
        }
    }
    console.log("Tables cleared.");
    process.exit(0);
};

reset();
