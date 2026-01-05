import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, 'debug-reports', 'issued_tokens.log');

export function logAndReturnToken(res, token, site, ...extras) {
    try {
        const payload = (() => {
            try {
                const p = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                const buff = Buffer.from(p, 'base64'); return JSON.parse(buff.toString());
            } catch (e) { return { decodeError: true }; }
        })();

        // Ensure directory exists
        const dir = path.dirname(LOG_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const entry = { ts: new Date().toISOString(), site, tokenSample: token.slice(0, 20) + '...', payload };
        fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
        console.log('[TOKEN DEBUG] logged token:', site, 'payload:', payload);
    } catch (e) { console.error('[TOKEN DEBUG] logging failed', e); }

    // Reconstruct the response body based on how it was called in index.js
    // index.js called: logAndReturnToken(res, token, site, student.student_id, student.name, !student.course_id)
    // So extras = [student_id, name, needs_course_selection]

    // To remain cleaner, let's just make it accept an object or arguments. 
    // Given the caller is fixed in index.js, let's Map the args to the expected keys.
    const [student_id, name, needs_course_selection] = extras;

    return res.json({
        token,
        student_id,
        name,
        needs_course_selection
    });
}

// Flexible version that takes the whole body object
export function logAndReturnBodyWithToken(res, body, site) {
    if (body.token) {
        try {
            const token = body.token;
            const payload = (() => {
                try {
                    const p = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                    const buff = Buffer.from(p, 'base64'); return JSON.parse(buff.toString());
                } catch (e) { return { decodeError: true }; }
            })();

            const dir = path.dirname(LOG_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const entry = { ts: new Date().toISOString(), site, tokenSample: token.slice(0, 20) + '...', payload };
            fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
            console.log('[TOKEN DEBUG] logged token:', site, 'payload:', payload);
        } catch (e) { console.error('[TOKEN DEBUG] logging failed', e); }
    }
    return res.json(body);
}
