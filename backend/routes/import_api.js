/* ADDED BY ANTI-GRAVITY */
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { importSingleFile } from '../import_single_file.js';
import { importCurriculumFile } from '../import_curriculum.js';

const router = express.Router();
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `import_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// Secure Middleware (Simple Password)
const requireAdminPw = (req, res, next) => {
    const pw = req.headers['x-admin-pw'] || req.body.pw;
    const expected = process.env.IMPORT_ADMIN_PASSWORD || 'antigravity';

    console.log(`[IMPORT API] Auth Check. Provided: '${pw ? '***' : 'missing'}', Match: ${pw === expected}`);

    if (pw === expected) return next();
    console.warn(`[IMPORT API] Auth Failed. IP: ${req.ip}`);
    return res.status(403).json({ error: 'Unauthorized. Provide correct password.' });
};

router.post('/upload', upload.single('file'), requireAdminPw, async (req, res) => {
    console.log(`[IMPORT API] Student Upload Request received.`);
    if (!req.file) {
        console.error(`[IMPORT API] No file attached.`);
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        console.log(`[IMPORT API] Processing file: ${req.file.path}`);
        const report = await importSingleFile(req.file.path);
        console.log(`[IMPORT API] Import Success. Errors: ${report.errors.length}`);
        res.json({ ok: true, report });
    } catch (e) {
        console.error(`[IMPORT API] Import Failed:`, e);
        res.status(500).json({ error: e.message });
    }
});

// NEW: Upload Curriculum / Syllabus
router.post('/curriculum', upload.single('file'), requireAdminPw, async (req, res) => {
    console.log(`[IMPORT API] Curriculum Upload Request received.`);
    if (!req.file) {
        console.error(`[IMPORT API] No file attached.`);
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        console.log(`[IMPORT API] Processing file: ${req.file.path}`);
        const report = await importCurriculumFile(req.file.path);
        console.log(`[IMPORT API] Curriculum Import Success. Inserted: ${report.inserted}`);
        res.json({ ok: true, report });
    } catch (e) {
        console.error(`[IMPORT API] Curriculum Import Failed:`, e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
