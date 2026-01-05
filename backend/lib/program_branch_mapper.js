
/**
 * Canonical Mapper for Program and Branch names.
 * Enforces a Single Source of Truth for matching Students to Curriculum.
 */

export function normalizeProgram(input) {
    if (!input) return null;
    const v = input.toLowerCase().trim();

    // Engineering Variations
    if (["b tech", "b.tech", "btech", "engineering", "engg"].includes(v)) return "engineering";

    // Management Variations
    if (["mba", "mba tech", "mba phase 1"].includes(v)) return "mba";

    // Pharma Variations
    if (["b.pharm", "b.pharma", "pharma", "pharmacy"].includes(v)) return "pharma";

    // Law Variations
    if (["law", "llb", "b.b.a., ll.b. (hons.)"].includes(v)) return "law";

    return v; // Return normalized lowercase or trim if no map found, but caller might enforce list.
}

export function normalizeBranch(input) {
    if (!input) return null;
    const v = input.toLowerCase().trim();

    // Data Science (Explicit User Request: "Data Science", "DS", "DATA SCIENCE" -> ds)
    if (["data science", "datascience", "ds", "cs-ds", "cs ds"].includes(v)) return "ds";

    // Computer Engineering (Explicit User Request: "Computer Engineering", "CE" -> ce)
    // Also mapping general "CS" and "B.Tech CS" to CE for standard curriculum matching
    if (["computer engineering", "computer eng", "ce", "comp eng", "computer", "cs", "b.tech cs", "computer science"].includes(v)) return "ce";

    // IT
    if (["information technology", "it"].includes(v)) return "it";

    // EXTC
    if (["electronics & telecommunication", "extc", "electronics"].includes(v)) return "extc";

    // Mechanical
    if (["mechanical", "mech"].includes(v)) return "mech";

    // AI/ML
    if (["artificial intelligence", "ai", "aiml", "ai&ml"].includes(v)) return "ai-ml";

    // Cybersecurity
    if (["cyber security", "cybersecurity", "cys"].includes(v)) return "cys";

    return input.toLowerCase(); // Default to Lowercase for strictly normalized keys
}
