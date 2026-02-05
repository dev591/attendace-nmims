
import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

// Use the same Redis connection as IORedis/Socket.IO if possible, 
// or let BullMQ handle its own connection params.
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
};

// 1. Create Queues
const emailQueue = new Queue('email-queue', { connection });
const analyticsQueue = new Queue('analytics-queue', { connection });

// 2. Producer Helper
export const addEmailJob = async (data) => {
    // data: { to: '...', subject: '...', body: '...' }
    return await emailQueue.add('send-email', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    });
};

export const addAnalyticsJob = async (data) => {
    // data: { studentId: '...', type: 'recalc' }
    return await analyticsQueue.add('process-analytics', data);
};

export { emailQueue, analyticsQueue };
