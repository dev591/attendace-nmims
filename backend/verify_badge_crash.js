
import { evaluateBadges } from './lib/badge_engine.js';

async function check() {
    console.log("Checking S90020004...");
    try {
        const res = await evaluateBadges('S90020004');
        console.log("Result Length:", res.length);
        if (res.length > 0) console.log("First Badge:", res[0].name);
    } catch (e) {
        console.error("CRASH:", e);
    } finally {
        process.exit();
    }
}
check();
