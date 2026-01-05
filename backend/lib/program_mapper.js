
/**
 * Maps student program strings (from SAP/Excel) to Curriculum program strings.
 * This is critical because the Master Sheet uses specific streams "B.Tech CS", 
 * while the Curriculum might be generic "Engineering".
 */
export function normalizeProgram(rawProgram) {
    if (!rawProgram) return '';
    const p = rawProgram.trim();

    const MAP = {
        'B.Tech CS-DS': 'Engineering',
        'B.Tech CS': 'Engineering',
        'B.Tech IT': 'Engineering',
        'B.Tech EXTC': 'Engineering',
        'B.Tech Mech': 'Engineering',
        'MBA Tech': 'MBA',
        'MBA Phase 1': 'MBA',
        'B.Pharm': 'Pharma',
        'B.Pharma': 'Pharma'
    };

    if (MAP[p]) return MAP[p];

    // Fallback: Case-insensitive check
    const lower = p.toLowerCase();
    for (const key of Object.keys(MAP)) {
        if (key.toLowerCase() === lower) return MAP[key];
    }

    // Common Lowercase matches
    if (lower.includes('engineering') || lower.includes('b.tech') || lower.includes('btech')) return 'Engineering';
    if (lower.includes('mba')) return 'MBA';
    if (lower.includes('pharm')) return 'Pharma';
    if (lower.includes('law')) return 'Law';

    return p; // Return original if no map found
}
