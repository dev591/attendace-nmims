import { query } from './db.js';
// Mock Express Request
import { getStudentAnalyticsOverview, calculateMomentum, calculateOverallStatus } from './attendance_analytics.js';

async function verify() {
    try {
        const studentId = 'S90020054'; // MBA Student

        console.log('--- Testing Dashboard Stats Logic ---');

        const overview = await getStudentAnalyticsOverview(studentId);
        console.log(`Fetched stats for ${overview.length} subjects.`);

        const momentum = await calculateMomentum(studentId);
        console.log(`Momentum: ${momentum}`);

        const status = calculateOverallStatus(overview);
        console.log(`Worayyy Safe: ${status.is_all_safe}`);

        console.log('✅ Logic executes without error.');

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

verify();
