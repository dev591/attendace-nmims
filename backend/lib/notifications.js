/* ADDED BY ANTI-GRAVITY */
/**
 * notifications.js
 * In-memory notification logger.
 */

import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'debug-reports', 'notifications.log');

export async function notifyLowAttendance(sapid, subject_id, pct) {
    const msg = `[${new Date().toISOString()}] ALERT: Student ${sapid} low attendance in ${subject_id}: ${pct}%`;
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
    // TODO: Integrate Email/SMS here
}

export async function notifyBadgeAwarded(sapid, badgeTitle) {
    const msg = `[${new Date().toISOString()}] CONGRATS: Student ${sapid} earned badge "${badgeTitle}"`;
    fs.appendFileSync(LOG_FILE, msg + '\n');
}
