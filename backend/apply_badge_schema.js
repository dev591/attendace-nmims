
import { query } from './db.js';

async function applySchema() {
    console.log("🏅 Applying Badge System Schema...");

    try {
        // 1. Badges Metadata Table
        await query('DROP TABLE IF EXISTS badges CASCADE');
        await query(`
            CREATE TABLE badges (
                code VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon VARCHAR(20),
                unlock_criteria TEXT,
                category VARCHAR(20) DEFAULT 'general'
            );
        `);
        console.log("✅ Table 'badges' ready.");

        // 2. Student Badges (Earned)
        await query('DROP TABLE IF EXISTS student_badges CASCADE');
        await query(`
            CREATE TABLE student_badges (
                student_id VARCHAR(50),
                badge_code VARCHAR(50),
                awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB DEFAULT '{}',
                PRIMARY KEY (student_id, badge_code),
                FOREIGN KEY (badge_code) REFERENCES badges(code)
            );
        `);
        console.log("✅ Table 'student_badges' ready.");

        // 3. Add Flags to Students Table
        // safely add columns if they don't exist
        const addColumn = async (col, type, def) => {
            try {
                await query(`ALTER TABLE students ADD COLUMN ${col} ${type} DEFAULT ${def}`);
                console.log(`✅ Added column '${col}' to students.`);
            } catch (e) {
                // Ignore if exists
                if (!e.message.includes("already exists")) console.error(e);
            }
        };

        await addColumn('has_been_danger', 'BOOLEAN', 'FALSE');
        await addColumn('used_simulator', 'BOOLEAN', 'FALSE');

        // 4. Seed Badges
        const badges = [
            {
                code: 'PERFECT_START',
                name: 'Perfect Start',
                icon: '⭐',
                desc: 'Attend the first 3 conducted classes of the semester without missing any.',
                crit: 'Attend first 3 classes (100% record).'
            },
            {
                code: 'CONSISTENCY_CHAMP',
                name: 'Consistency Champ',
                icon: '🔁',
                desc: 'Maintain ≥ 80% attendance for 14 consecutive days.',
                crit: '14-Day Streak with ≥80% Avg.'
            },
            {
                code: 'SAFE_ZONE_MASTER',
                name: 'Safe Zone Master',
                icon: '🛡️',
                desc: 'All subjects are in the SAFE zone.',
                crit: '100% Subjects Safe.'
            },
            {
                code: 'COMEBACK_KID',
                name: 'Comeback Kid',
                icon: '🔥',
                desc: 'Recover a subject from DANGER to SAFE.',
                crit: 'Move from Danger Zone to Safe Zone.'
            },
            {
                code: 'ATTENDANCE_STRATEGIST',
                name: 'Attendance Strategist',
                icon: '🧠',
                desc: 'Use the Attendance Simulator and reach the safe zone later.',
                crit: 'Use Simulator + Reach Safe Zone.'
            },
            {
                code: 'ZERO_MISS_HERO',
                name: 'Zero Miss Hero',
                icon: '🚫',
                desc: 'Miss 0 classes in a full week (Mon-Fri/Sat).',
                crit: '0 Absences in a Week (Min 3 classes).'
            },
            {
                code: 'MOMENTUM_BUILDER',
                name: 'Momentum Builder',
                icon: '⚡',
                desc: 'Attend classes on 5 consecutive active days.',
                crit: '5-Day Attendance Streak.'
            },
            {
                code: 'SEMESTER_SURVIVOR',
                name: 'Semester Survivor',
                icon: '🎓',
                desc: 'End the semester with all subjects above mandatory percentage.',
                crit: 'End of Sem: All Subjects Safe.'
            }
        ];

        for (const b of badges) {
            await query(`
                INSERT INTO badges (code, name, description, icon, unlock_criteria)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    icon = EXCLUDED.icon,
                    unlock_criteria = EXCLUDED.unlock_criteria
            `, [b.code, b.name, b.desc, b.icon, b.crit]);
        }
        console.log("✅ Badges Seeded.");

    } catch (e) {
        console.error("❌ Schema Apply Failed:", e);
    } finally {
        process.exit();
    }
}

applySchema();
