
import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { query } from '../db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/import/faculty', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`[Import Faculty] Processing ${rawData.length} rows...`);

        const report = {
            total: rawData.length,
            inserted: 0,
            updated: 0,
            errors: []
        };

        const SALT_ROUNDS = 10;
        const defaultHash = await bcrypt.hash('123456', SALT_ROUNDS); // Default password

        for (const [index, row] of rawData.entries()) {
            // Expected Cols: Name, SapID, Email, Phone, Dept, Designation
            const name = row['Name'] || row['name'];
            const sapid = row['SapID'] || row['sapid'] || row['Faculty ID'];
            const email = row['Email'] || row['email'];
            const phone = row['Phone'] || row['phone'];
            const dept = row['Dept'] || row['Department'] || row['School'];
            const designation = row['Designation'] || row['Role'] || 'Faculty';

            if (!name || !sapid) {
                report.errors.push(`Row ${index + 1}: Missing Name or SapID`);
                continue;
            }

            try {
                // Upsert Faculty
                // We use 'year' column to store 0 or null for faculty, not relevant.
                // 'program' can store designation fallback.

                const q = `
                    INSERT INTO students (
                        student_id, sapid, name, email, phone, dept, designation, role, password_hash
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, 'faculty', $8
                    )
                    ON CONFLICT (sapid) DO UPDATE SET
                        name = EXCLUDED.name,
                        email = EXCLUDED.email,
                        phone = EXCLUDED.phone,
                        dept = EXCLUDED.dept,
                        designation = EXCLUDED.designation,
                        role = 'faculty'
                `;

                // Generate consistent ID if new
                const student_id = `FAC_${sapid}`;

                await query(q, [
                    student_id, sapid.toString(), name, email, phone?.toString(), dept, designation, defaultHash
                ]);
                report.inserted++;

            } catch (err) {
                console.error(`Row ${index} Error:`, err.message);
                report.errors.push(`Row ${index + 1} (${name}): ${err.message}`);
            }
        }

        res.json({ message: "Faculty Import Complete", report });

    } catch (err) {
        console.error("Faculty Import Critical Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
