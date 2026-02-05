
import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

// 1. Singleton Redis Connection logic for Queues
const redisConfig = process.env.REDIS_URL
    ? { connection: new Queue.Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null }) }
    : {
        connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            maxRetriesPerRequest: null
        }
    };

console.log(`[QUEUE] Configured with ${process.env.REDIS_URL ? 'External URL' : 'Localhost'}`);

// 1. Create Queues
const emailQueue = new Queue('email-queue', redisConfig);
const analyticsQueue = new Queue('analytics-queue', redisConfig);

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
