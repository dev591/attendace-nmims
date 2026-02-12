
const scopeCell = "Scope: STME | B.Tech | Semester 3 | Year 2";
let program = null, semester = null, school = null, section = null;

const KNOWN_SCHOOLS = ['STME', 'SPTM', 'SOL', 'SBM', 'SAMSOE', 'SDSOS', 'KPMSOL', 'SOD', 'SOS'];

if (scopeCell && typeof scopeCell === 'string') {
    const s = scopeCell.toUpperCase();
    const tokens = s.replace('SCOPE:', '').split(/[\s|,:,-]+/).map(t => t.trim());

    console.log("Tokens Upper:", tokens);

    // 1. Find School
    for (const t of tokens) {
        if (KNOWN_SCHOOLS.includes(t)) {
            school = t;
            break;
        }
    }

    const sLow = scopeCell.toLowerCase();
    const tokensLow = sLow.replace('scope:', '').split(/[\s|,:,-]+/).map(t => t.trim());

    console.log("Tokens Lower:", tokensLow);

    // 2. Find Semester
    for (let i = 0; i < tokensLow.length; i++) {
        if (['sem', 'semester'].includes(tokensLow[i]) && tokensLow[i + 1]) {
            semester = parseInt(tokensLow[i + 1]);
        } else if (/^sem\d+$/.test(tokensLow[i])) {
            semester = parseInt(tokensLow[i].replace('sem', ''));
        }
    }

    // 3. Find Program
    if (sLow.includes('b.tech') || sLow.includes('tech')) program = 'B.Tech';
    else if (sLow.includes('mba')) program = 'MBA';
    else if (sLow.includes('m.tech')) program = 'M.Tech';
    else if (sLow.includes('pharm')) program = 'Pharmacy';
    else if (sLow.includes('law')) program = 'Law';
}

console.log("Result:", { school, program, semester });

if (!program) program = 'B.Tech';

console.log("Final Result:", { school, program, semester });
