
import xlsx from 'xlsx';
import { query } from '../db.js';

/**
 * Processes the uploaded Student Data Excel file.
 */
export async function processStudentUpload(fileBuffer, adminSapid) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheets = workbook.SheetNames;

    let stats = {
        total: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: []
    };

    console.log(`[Ingest] Starting upload for ${sheets.length} sheets by ${adminSapid}`);

    // Helper to normalize strings: "SAP ID" -> "sapid", "Parent_Phone" -> "parentphone"
    const normalize = (str) => (str || '').toString().toLowerCase().replace(/[\s_\-]/g, '');

    // Allowed mappings (Normalized Header -> DB Field)
    const fieldMapping = {
        'sapid': 'sapid',
        'sap_id': 'sapid',
        'rollno': 'sapid',
        'rollnumber': 'sapid',

        'name': 'name',
        'studentname': 'name',
        'fullname': 'name',

        'email': 'email',
        'mail': 'email',
        'emailid': 'email',

        'phone': 'phone',
        'mobile': 'phone',
        'contact': 'phone',
        'phonenumber': 'phone',

        'year': 'year',
        'batch': 'year',
        'currentyear': 'year',

        'program': 'program',
        'course': 'program',
        'stream': 'program',

        'dept': 'dept',
        'department': 'dept',
        'school': 'dept', // Sometimes school is mapped to dept in this context

        'parentname': 'parent_name',
        'fathername': 'parent_name',
        'mothername': 'parent_name',
        'guardian': 'parent_name',
        'father': 'parent_name',

        'parentphone': 'parent_phone',
        'parentcontact': 'parent_phone',
        'fathermobile': 'parent_phone',
        'parentmobile': 'parent_phone'
    };

    for (const sheetName of sheets) {
        const defaultDept = sheetName.trim();
        // Get raw JSON first to inspect headers
        const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        if (!rawData || rawData.length === 0) continue;

        // Extract and normalize headers from first row
        const rawHeaders = rawData[0];
        const headerMap = {}; // Index -> DB Field Name

        rawHeaders.forEach((h, idx) => {
            const norm = normalize(h);
            const dbField = fieldMapping[norm];
            if (dbField) {
                headerMap[idx] = dbField;
            }
        });

        console.log(`[Ingest] Sheet '${sheetName}' Headers mapped:`, headerMap);

        // Process data rows (skip header row)
        const rows = rawData.slice(1);
        console.log(`[Ingest] Processing ${rows.length} rows in ${sheetName}`);

        for (const rowArray of rows) {
            stats.total++;

            // Construct object from row array using headerMap
            const rowObj = {};
            // Populate defaults
            rowObj['dept'] = defaultDept;

            Object.keys(headerMap).forEach(idx => {
                if (rowArray[idx] !== undefined) {
                    rowObj[headerMap[idx]] = rowArray[idx];
                }
            });

            // Validate Mandatory Fields
            if (!rowObj['sapid'] || !rowObj['name']) {
                // Log only if it's not a completely empty row
                if (rowArray.length > 0) {
                    stats.skipped++;
                }
                continue;
            }

            try {
                // 2. UPSERT Query
                const sql = `
                    INSERT INTO students (
                        sapid, name, email, dept, program, year, 
                        parent_name, parent_phone, 
                        password_hash, role
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, 
                        $7, $8, 
                        $9, 'student'
                    )
                    ON CONFLICT (sapid) DO UPDATE SET
                        name = EXCLUDED.name,
                        email = EXCLUDED.email,
                        dept = EXCLUDED.dept,
                        program = EXCLUDED.program,
                        year = EXCLUDED.year,
                        parent_name = EXCLUDED.parent_name,
                        parent_phone = EXCLUDED.parent_phone
                    RETURNING (xmax = 0) AS inserted;
                `;

                const defaultPass = "123456";

                const res = await query(sql, [
                    String(rowObj['sapid']).trim(),
                    String(rowObj['name']).trim(),
                    rowObj['email'] || null,
                    rowObj['dept'],
                    rowObj['program'] || 'Core',
                    rowObj['year'] || '1',
                    rowObj['parent_name'] || null,
                    String(rowObj['parent_phone'] || '').trim(),
                    defaultPass
                ]);

                if (res.rows[0].inserted) {
                    stats.inserted++;
                } else {
                    stats.updated++;
                }

            } catch (err) {
                console.error(`[Ingest Error] ${rowObj['sapid']}:`, err.message);
                stats.errors.push(`${rowObj['sapid']}: ${err.message}`);
            }
        }
    }

    // 3. Log to DB
    const status = stats.errors.length === 0 ? 'success' : (stats.inserted + stats.updated > 0 ? 'partial' : 'failed');

    // Construct error message with skipped count
    let errorMsg = stats.errors.join('; ').substring(0, 1000);
    if (stats.skipped > 0 && !errorMsg) {
        errorMsg = `${stats.skipped} rows skipped (empty or missing keys)`;
    }

    const logSql = `
        INSERT INTO upload_logs (file_name, file_type, status, total_rows, processed_rows, error_log, uploaded_by) 
        VALUES ($1, 'student_data', $2, $3, $4, $5, $6)
    `;
    await query(logSql, [
        'student_upload.xlsx',
        status,
        stats.total,
        stats.inserted + stats.updated,
        errorMsg,
        adminSapid
    ]);

    return stats;
}
