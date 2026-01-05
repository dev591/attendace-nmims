import { query } from './db.js';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const schemaPath = new URL('./schema.sql', import.meta.url).pathname;
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

const seed = async () => {
  try {
    console.log('🌱 Seeding database...');

    // 1. Run Schema
    await query(schemaSql);
    console.log('✅ Schema applied.');

    // 2. Insert Courses
    await query(`
      INSERT INTO courses (course_id, name, year, dept)
      VALUES 
      ('C_CS_SEM3', 'B.Tech CS Semester 3', 2, 'Computer Science'),
      ('C_IT_SEM3', 'B.Tech IT Semester 3', 2, 'Information Tech')
    `);

    // 3. Insert Subjects
    await query(`
      INSERT INTO subjects (subject_id, code, name, credits)
      VALUES 
      ('SUB01', 'DS101', 'Data Structures', 4),
      ('SUB02', 'AL102', 'Algorithms', 4),
      ('SUB03', 'DB103', 'Database Systems', 3),
      ('SUB04', 'OS104', 'Operating System', 3)
    `);

    // 4. Link Course <-> Subjects
    await query(`
      INSERT INTO course_subjects (course_id, subject_id, faculty_name)
      VALUES
      ('C_CS_SEM3', 'SUB01', 'Prof. Sharma'),
      ('C_CS_SEM3', 'SUB02', 'Dr. Reddy'),
      ('C_CS_SEM3', 'SUB03', 'Prof. Gupta'),
      ('C_CS_SEM3', 'SUB04', 'Dr. Patil')
    `);

    // 5. Insert Students (with hashed passwords)
    // Default password for all: 'password123'
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    await query(`
      INSERT INTO students (student_id, sapid, password_hash, name, email, program, year, dept, course_id)
      VALUES 
      ('S001', '50012023', $1, 'Dev Chalana', 'dev@nmims.edu', 'B.Tech CS-DS', 2, 'Computer Science', 'C_CS_SEM3'),
      ('S002', '50022023', $1, 'Rohan Mehta', 'rohan@nmims.edu', 'B.Tech CS-DS', 2, 'Computer Science', 'C_CS_SEM3'),
      ('S003', '50032023', $1, 'New Student', 'new@nmims.edu', 'B.Tech CS-DS', 2, 'Computer Science', NULL) 
    `, [hash]);

    // 6. Insert Sessions
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    let sessions = [];

    const daysAgo = (n) => {
      const d = new Date();
      d.setDate(today.getDate() - n);
      return formatDate(d);
    };

    const daysFuture = (n) => {
      const d = new Date();
      d.setDate(today.getDate() + n);
      return formatDate(d);
    };

    // Past Sessions
    sessions.push({ id: 'S1', sub: 'SUB01', date: daysAgo(10), status: 'conducted' });
    sessions.push({ id: 'S2', sub: 'SUB02', date: daysAgo(9), status: 'conducted' });
    sessions.push({ id: 'S3', sub: 'SUB01', date: daysAgo(8), status: 'conducted' });
    sessions.push({ id: 'S4', sub: 'SUB03', date: daysAgo(7), status: 'conducted' });
    sessions.push({ id: 'S5', sub: 'SUB01', date: daysAgo(5), status: 'conducted' });
    sessions.push({ id: 'S6', sub: 'SUB04', date: daysAgo(4), status: 'conducted' });
    sessions.push({ id: 'S7', sub: 'SUB02', date: daysAgo(2), status: 'conducted' });
    sessions.push({ id: 'S8', sub: 'SUB01', date: daysAgo(1), status: 'conducted' }); // Yesterday

    // Future
    sessions.push({ id: 'S9', sub: 'SUB01', date: daysFuture(1), status: 'scheduled' }); // Tomorrow
    sessions.push({ id: 'S10', sub: 'SUB02', date: daysFuture(2), status: 'scheduled' });

    for (const s of sessions) {
      await query(`
            INSERT INTO sessions (session_id, subject_id, date, start_time, end_time, status)
            VALUES ($1, $2, $3, '09:00', '10:00', $4)
        `, [s.id, s.sub, s.date, s.status]);
    }

    // 7. Insert Attendance (S001)
    const attData = [
      { sess: 'S1', stud: 'S001', pres: true },
      { sess: 'S3', stud: 'S001', pres: false },
      { sess: 'S5', stud: 'S001', pres: false },
      { sess: 'S8', stud: 'S001', pres: true },
      { sess: 'S2', stud: 'S001', pres: true },
      { sess: 'S7', stud: 'S001', pres: true },
      { sess: 'S4', stud: 'S001', pres: false },
      { sess: 'S6', stud: 'S001', pres: true },
    ];

    for (const a of attData) {
      await query(`
            INSERT INTO attendance (session_id, student_id, present, source)
            VALUES ($1, $2, $3, 'seed')
        `, [a.sess, a.stud, a.pres]);
    }

    await query(`INSERT INTO settings (key, value) VALUES ('thresholds', '{"default": 0.75, "lab": 0.85}')`);

    console.log('✅ Seed complete.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
