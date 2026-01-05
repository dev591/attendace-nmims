import xlsx from 'xlsx';
import path from 'path';

const data = [
    { Program: 'Engineering', Year: 1, SubjectCode: 'MATH101', SubjectName: 'Engineering Mathematics I', TotalClasses: 50, MandatoryPct: 80 },
    { Program: 'Engineering', Year: 1, SubjectCode: 'PHY101', SubjectName: 'Engineering Physics', TotalClasses: 45, MandatoryPct: 80 },
    { Program: 'Engineering', Year: 2, SubjectCode: 'DS201', SubjectName: 'Data Structures', TotalClasses: 55, MandatoryPct: 75 },
    { Program: 'Law', Year: 1, SubjectCode: 'CONST101', SubjectName: 'Constitutional Law', TotalClasses: 60, MandatoryPct: 85 }
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(data);
xlsx.utils.book_append_sheet(wb, ws, 'Curriculum');

const outFile = path.join(process.cwd(), 'curriculum_template.xlsx');
xlsx.writeFile(wb, outFile);
console.log('Created ' + outFile);
