
import { importCurriculumFile } from './import_curriculum.js';
import path from 'path';

async function reimport() {
    const file = path.join(process.cwd(), 'uploads', 'import_1767724274434_Curriculum_100_Mixed.xlsx');
    console.log("🔄 RE-IMPORTING CURRICULUM TO SYNC STATE...");
    const report = await importCurriculumFile(file);
    console.log("Report:", report);
    process.exit();
}

reimport();
