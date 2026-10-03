// Ombordagi kanonik fanlar va erkin matnli mavzudan fanni aniqlash.

export const GENERAL_SUBJECT = 'Umumiy bilim';

// Bitta so'zli kalitlar — mavzudagi biror so'zning BOSHI bilan solishtiriladi ("tarix" → "tarixi" ✓, "son" ✗ "insoniyat").
// Bo'shliqli kalitlar — butun matn ichidan qidiriladi.
const SUBJECT_KEYWORDS: Record<string, string[]> = {
    'Matematika': ['matemat', 'algebra', 'geometr', 'arifmet', 'trigonometr', 'tenglam', 'kasr', 'foiz', 'ehtimol', 'statistik', 'hosila', 'integral', 'math', 'математ', 'алгебр', 'геометр'],
    'Fizika': ['fizik', 'mexanik', 'elektr', 'optik', "yorug'lik", 'termodinam', 'kvant', 'nisbiylik', 'yadro', 'magnit', 'physic', 'физик'],
    'Kimyo': ['kimyo', 'molekul', 'atom', 'kislota', 'ishqor', 'reaksiya', 'organik', 'davriy', 'chemi', 'хими'],
    'Biologiya': ['biolog', 'hujayra', 'fotosintez', 'genetik', 'irsiyat', 'evolyutsiya', 'ekolog', 'anatomiya', "o'simlik", 'hayvon', 'mikrob', 'botanika', 'zoolog', 'биолог'],
    'Tarix': ['tarix', 'imperiya', 'urush', 'sivilizatsiya', 'renessans', 'mustaqillik', 'temur', 'xonlik', 'history', 'истори', 'ipak yo'],
    'Geografiya': ['geograf', 'materik', 'okean', 'iqlim', 'daryo', 'gidrolog', 'aholi', 'poytaxt', 'geography', 'географ'],
    'Ona tili va adabiyot': ['adabiyot', "she'r", 'imlo', 'morfolog', 'sintaksis', 'fonetik', 'navoiy', 'yozuvchi', 'shoir', 'doston', 'folklor', 'literature', 'литератур', 'ona tili', "o'zbek tili"],
    'Ingliz tili': ['ingliz', 'english', 'grammar', 'vocabulary', 'tense', 'phrasal', 'idiom'],
    'Rus tili': ['русск', 'rus tili', 'rus adabiyoti'],
    'Informatika': ['informatik', 'dasturlash', 'algoritm', 'kompyuter', 'internet', 'tarmoq', 'kiberxavfsizlik', "ma'lumotlar", 'python', 'javascript', 'html', "sun'iy intellekt", 'neyron', 'computer', 'информат', 'программ'],
    [GENERAL_SUBJECT]: ['umumiy', 'zakovat', 'mantiq', 'erudit'],
};

export const SUBJECTS = Object.keys(SUBJECT_KEYWORDS);

export function normalizeText(text: string): string {
    return text.toLowerCase().replace(/[‘’ʻʼ`´]/g, "'").replace(/\s+/g, ' ').trim();
}

function tokens(text: string): string[] {
    return normalizeText(text).split(/[^\p{L}']+/u).filter(Boolean);
}

/** Mavzu matnidan eng mos fanni topadi; topilmasa null. */
export function detectSubject(topic: string): string | null {
    const norm = normalizeText(topic);
    const words = tokens(topic);
    let best: string | null = null;
    let bestScore = 0;
    for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
        if (normalizeText(subject) === norm) return subject;
        let score = 0;
        for (const kw of keywords) {
            const hit = kw.includes(' ') ? norm.includes(kw) : words.some(w => w.startsWith(kw));
            if (hit) score++;
        }
        if (score > bestScore) {
            best = subject;
            bestScore = score;
        }
    }
    return best;
}

/** Mavzudagi fan nomini bildirmaydigan, mazmunli so'zlar — ombordan aniqroq savol topish uchun. */
export function topicWords(topic: string, subject: string | null): string[] {
    const subjectKeywords = subject ? SUBJECT_KEYWORDS[subject] ?? [] : [];
    return tokens(topic)
        .filter(w => w.length >= 4)
        .filter(w => !subjectKeywords.some(kw => !kw.includes(' ') && w.startsWith(kw)))
        .filter(w => !["o'zbekiston", 'haqida', 'bo\'yicha', 'savollar', 'mavzu'].includes(w))
        .slice(0, 5);
}

/** "7-sinf", "7", "1-kurs" kabi qiymatlardan sinfni ajratadi (oliy ta'lim = 12). */
export function parseGrade(value: string | number | null | undefined): number | null {
    if (value == null || value === '') return null;
    if (typeof value === 'number') return value >= 1 && value <= 12 ? value : null;
    const v = normalizeText(String(value));
    if (/kurs|universitet|oliy|bakalavr|magistr/.test(v)) return 12;
    const m = v.match(/\d{1,2}/);
    if (!m) return null;
    const n = parseInt(m[0], 10);
    return n >= 1 && n <= 11 ? n : null;
}

export function parseDifficulty(value: string | number | null | undefined): number {
    if (typeof value === 'number') return Math.min(3, Math.max(1, value));
    const v = normalizeText(String(value ?? ''));
    if (v.startsWith('oson') || v === 'easy') return 1;
    if (v.startsWith('qiyin') || v === 'hard') return 3;
    return 2;
}
