/* ADDED BY ANTI-GRAVITY */
/**
 * import_helpers.js
 * Helpers for normalizing and validating imported data.
 */

export function normalizeHeader(h) {
    return h.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

export function normalizeString(s) {
    if (!s) return null;
    return String(s).trim();
}

export function normalizeDate(d) {
    if (!d) return null;
    if (d instanceof Date) return d.toISOString().split('T')[0];
    // Simple parse attempt for YYYY-MM-DD or DD-MM-YYYY
    const s = String(d).trim();
    return s; // Rely on Postgres/App to parse ISO strings, or enhance if needed
}

export function normalizeBoolean(b) {
    if (b === true || b === 1 || String(b).toLowerCase() === 'true' || String(b).toLowerCase() === 'yes' || String(b).toLowerCase() === 'present') return true;
    return false;
}

export function validateRequired(row, fields) {
    const missing = [];
    fields.forEach(f => {
        if (!row[f]) missing.push(f);
    });
    return missing;
}
