
import { Worker } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
};

// --- Processors ---
const emailProcessor = async (job) => {
    console.log(`[Worker] 📧 Sending email to ${job.data.to}...`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (job.data.forceFail) {
        throw new Error("Simulated Email Failure");
    }

    console.log(`[Worker] ✅ Email sent to ${job.data.to}`);
    return { status: 'sent', messageId: '123' };
};

const analyticsProcessor = async (job) => {
    console.log(`[Worker] 📊 Processing analytics for ${job.data.studentId}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[Worker] ✅ Analytics updated for ${job.data.studentId}`);
    return { processed: true };
};

// --- Workers ---
export const startWorkers = () => {
    const emailWorker = new Worker('email-queue', emailProcessor, { connection });
    const analyticsWorker = new Worker('analytics-queue', analyticsProcessor, { connection });

    emailWorker.on('completed', (job) => {
        console.log(`[Queue] Job ${job.id} completed!`);
    });

    emailWorker.on('failed', (job, err) => {
        console.error(`[Queue] ❌ Job ${job.id} failed: ${err.message}`);
    });

    console.log("[Queue] Workers Started");
};
