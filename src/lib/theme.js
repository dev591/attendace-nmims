/* ADDED BY ANTI-GRAVITY */
export const THEMES = {
    'engineering': {
        name: 'Engineering',
        className: 'theme-engineering',
        cssVars: {
            '--nmims-primary': '#00e5ff',
            '--nmims-secondary': '#00b8d4',
            '--bg-page': '#030814',
            '--text-body': '#dfeeff',
            '--card-bg': 'rgba(255,255,255,0.02)'
        },
        quotes: [
            { text: "Engineers like to solve problems. If there are no problems handily available, they will create their own problems.", author: "Scott Adams" },
            { text: "The scientist discovers a new type of material or energy and the engineer discovers a new use for it.", author: "Gordon Lindsay Glegg" },
            { text: "Engineering is the closest thing to magic that exists in the world.", author: "Elon Musk" },
            { text: "Math is my Passion. Engineering is my Profession.", author: "Wilfred James Dolor" },
            { text: "Strive for perfection in everything you do. Take the best that exists and make it better.", author: "Sir Henry Royce" },
            { text: "Software is eating the world.", author: "Marc Andreessen" },
            { text: "It’s not a bug – it’s an undocumented feature.", author: "Anonymous" }
        ]
    },
    'pharma': {
        name: 'Pharma',
        className: 'theme-pharma',
        cssVars: {
            '--nmims-primary': '#00c853',
            '--nmims-secondary': '#009624',
            '--bg-page': '#f1f8e9',
            '--text-body': '#1b5e20',
            '--card-bg': '#ffffff'
        },
        quotes: [
            { text: "Medicine is a science of uncertainty and an art of probability.", author: "William Osler" },
            { text: "Wherever the art of Medicine is loved, there is also a love of Humanity.", author: "Hippocrates" }
        ]
    },
    'default': {
        name: 'Default',
        className: 'theme-default',
        cssVars: {
            '--nmims-primary': '#D50000',
            '--nmims-secondary': '#B71C1C',
            '--bg-page': '#F8F9FA',
            '--text-body': '#111827',
            '--card-bg': '#ffffff'
        },
        quotes: [
            { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
            { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" }
        ]
    }
};

export function normalizeProgram(program) {
    if (!program) return 'default';
    const x = String(program).toLowerCase();

    // Engineering Keywords
    if (x.includes("cs") || x.includes("cse") || x.includes("it") || x.includes("eng") || x.includes("ds") || x.includes("aiml") || x.includes("aids") || x.includes("tech") || x.includes("computer"))
        return "engineering";

    // Pharma Keywords
    if (x.includes("phar") || x.includes("pharmacy") || x.includes("medicine"))
        return "pharma";

    return 'default';
}

export function applyTheme(programInput) {
    const key = normalizeProgram(programInput);
    const theme = THEMES[key];
    const root = document.documentElement;

    // Remove other theme classes
    Object.values(THEMES).forEach(t => document.body.classList.remove(t.className));

    // Add current theme class
    document.body.classList.add(theme.className);

    // Set CSS Vars
    if (theme.cssVars) {
        Object.entries(theme.cssVars).forEach(([k, v]) => {
            root.style.setProperty(k, v);
        });
    }

    // Persist
    localStorage.setItem('active_theme', key);
    return key;
}

export function getQuoteOfTheDay(programInput) {
    const key = normalizeProgram(programInput);
    const pool = THEMES[key].quotes;

    // Deterministic based on date
    const today = new Date();
    const seed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 100 + today.getDate(); // e.g., 20251015
    const index = seed % pool.length;

    return pool[index];
}
