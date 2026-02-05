
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dest = uploadDir;
        if (req.body.uploadType === 'proof' || req.params.uploadType === 'proof' || file.fieldname === 'proof') {
            dest = path.join(uploadDir, 'proofs');
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        } else if (file.fieldname === 'certificate') { // NEW
            dest = path.join(uploadDir, 'achievements');
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({ storage: storage });
