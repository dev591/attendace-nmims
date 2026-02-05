import express from 'express';
import { getClient } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /student/attendance-calculator
 * Calculates attendance scenarios based on user input + backend curriculum constraints.
 * STRICT: Does NOT modify DB. Purely simulation.
 * AUTH: Protected route. Uses JWT context.
 */
router.post('/attendance-calculator', authenticateToken, async (req, res) => {
    // 1. Get Context from Token (No DB lookup needed for student info)
    // 1. Get Context from Token
    const { sapid } = req.user; // Trust only SAPID from token
    const { subject_id, classes_conducted, classes_attended } = req.body;

    if (!subject_id) {
        return res.status(400).json({ error: 'Missing subject_id' });
    }

    const client = await getClient();
    try {
        // 1.5 Fetch Fresh Student Info (Reliable key generation)
        const sRes = await client.query('SELECT program, dept, year, semester FROM students WHERE sapid = $1', [sapid]);
        if (sRes.rows.length === 0) return res.status(404).json({ error: 'Student not found.' });

        const { program, dept, year, semester } = sRes.rows[0];

        // Normalize Key
        const { normalizeProgram, normalizeBranch } = await import('../lib/program_branch_mapper.js');
        const effProg = `${normalizeProgram(program).toLowerCase()}-${normalizeBranch(dept).toLowerCase()}`;

        console.log(`[CALCULATOR] User=${sapid} Key=${effProg} Y${year} S${semester} Sub=${subject_id}`);

        // 2. Fetch Curriculum for this Subject
        const currRes = await client.query(`
            SELECT * FROM curriculum 
            WHERE program = $1
            AND year = $2 
            AND semester = $3
            AND subject_code = $4
        `, [effProg, year, semester, subject_id]);

        if (currRes.rows.length === 0) {
            console.error(`[CALCULATOR] Failed to find subject. Key: ${effProg}, Y: ${year}, S: ${semester}, Code: ${subject_id}`);
            return res.status(404).json({ error: `Subject ${subject_id} not found in curriculum for ${effProg}.` });
        }

        const subject = currRes.rows[0];
        const total_planned = parseInt(subject.total_classes);
        const mandatory_pct = parseFloat(subject.min_attendance_pct);

        // 3. Inputs
        const conducted = parseInt(classes_conducted || 0);
        const attended = parseInt(classes_attended || 0);

        // Validation
        if (conducted < 0 || attended < 0) return res.status(400).json({ error: 'Values cannot be negative' });
        if (attended > conducted) return res.status(400).json({ error: 'Attended cannot be greater than conducted' });

        // 4. Calculations
        // A. Current Status
        let current_pct = 100;
        if (conducted > 0) {
            current_pct = Math.round((attended / conducted) * 100);
        }

        // B. Requirements
        const min_classes_required = Math.ceil((total_planned * mandatory_pct) / 100);
        const max_missable = total_planned - min_classes_required;
        const missed_so_far = conducted - attended;
        const can_still_miss = Math.max(0, max_missable - missed_so_far);

        // C. Future Projection (Can I ever reach target?)
        const remaining_sessions = Math.max(0, total_planned - conducted);
        const max_possible_attended = attended + remaining_sessions;
        const max_possible_pct = Math.round((max_possible_attended / total_planned) * 100);

        // D. Recovery (If below target, how many consecutive needed?)
        let must_attend_next = 0;
        if (current_pct < mandatory_pct) {
            // Formula: (attended + x) / (conducted + x) >= target
            // x >= (target*conducted - attended) / (1 - target)
            const target = mandatory_pct / 100;
            const num = (target * conducted) - attended;
            const den = 1 - target;
            if (den > 0) must_attend_next = Math.ceil(num / den);
        }

        // 5. Determine Status
        let status = "SAFE";
        let explanation = "You are in the safe zone.";

        if (max_possible_pct < mandatory_pct) {
            status = "SHORTAGE";
            explanation = `CRITICAL: Even if you attend all remaining sessions, max posssible is ${max_possible_pct}%. You will trigger the defaulter list.`;
        } else if (current_pct < mandatory_pct) {
            status = "WARNING";
            explanation = `You are currently below ${mandatory_pct}%. Attend next ${must_attend_next} classes to recover.`;
        } else if (can_still_miss === 0) {
            status = "WARNING";
            explanation = `Borderline. You cannot miss any more classes without dropping below ${mandatory_pct}%.`;
        } else {
            status = "SAFE";
            explanation = `You have a buffer of ${can_still_miss} sessions before hitting the limit.`;
        }

        return res.json({
            subject_name: subject.subject_name,
            current_pct,
            mandatory_pct,
            status,
            can_miss: can_still_miss,
            must_attend_next,
            final_possible_pct: max_possible_pct,
            explanation_text: explanation,
            input_received: { conducted, attended }
        });

    } catch (err) {
        console.error('Calculator Error:', err);
        return res.status(500).json({ error: String(err) });
    } finally {
        client.release();
    }
});


/**
 * POST /student/project
 * Student can upload/submit a project status.
 */
router.post('/project', authenticateToken, async (req, res) => {
    const { title, description, link } = req.body;
    if (!title || !link) return res.status(400).json({ error: "Title and Link are required" });

    try {
        const client = await getClient();
        // Insert
        await client.query(
            "INSERT INTO student_projects (student_id, title, description, link) VALUES ($1, $2, $3, $4)",
            [req.user.student_id, title, description, link]
        );
        client.release();
        res.json({ success: true, message: "Project submitted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
