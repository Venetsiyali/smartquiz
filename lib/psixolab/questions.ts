// PsixoLab — "Pedagogika. Psixologiya" fani uchun oʻyinli rejimlar maʼlumotlari.
// Savollar bitta ID ostida ikki tilda saqlanadi; ruscha matni yoʻq savol ruscha oʻyinga tushmaydi.
// Imlo: oʻ, gʻ uchun ʻ (U+02BB), tutuq belgisi uchun ʼ (U+02BC).

export type PsixoLang = 'uz' | 'ru';
export type PsixoLevel = 1 | 2 | 3;
export type PsixoTopic =
    | 'xotira' | 'diqqat' | 'tafakkur' | 'temperament' | 'motivatsiya'
    | 'didaktika' | 'metodlar' | 'tarbiya';

export const TOPIC_NAMES: Record<PsixoTopic, Record<PsixoLang, string>> = {
    xotira: { uz: 'Xotira', ru: 'Память' },
    diqqat: { uz: 'Diqqat', ru: 'Внимание' },
    tafakkur: { uz: 'Tafakkur', ru: 'Мышление' },
    temperament: { uz: 'Temperament va xarakter', ru: 'Темперамент и характер' },
    motivatsiya: { uz: 'Motivatsiya', ru: 'Мотивация' },
    didaktika: { uz: 'Didaktika tamoyillari', ru: 'Принципы дидактики' },
    metodlar: { uz: 'Oʻqitish metodlari', ru: 'Методы обучения' },
    tarbiya: { uz: 'Tarbiya usullari', ru: 'Методы воспитания' },
};

/** Bitta matn ikki tilda; ru boʻlmasa — savol faqat oʻzbekcha oʻyinda chiqadi. */
export interface Localized { uz: string; ru?: string }

/** "Psixolog-detektiv" (keys) va "Moslashtir" savollari — keyingi bosqichlarda toʻldiriladi. */
export interface PsixoQuestion {
    id: string;
    mode: 'detective' | 'match';
    topic: PsixoTopic;
    level: PsixoLevel;
    q: Localized;
    options: { uz: string[]; ru?: string[] };
    correct: number;            // options ichidagi toʻgʻri javob indeksi (ikki tilda bir xil tartib)
    explain: Localized;
}

/* ───────────────────────── Xotira sinovi ───────────────────────── */

/**
 * words    — bir-biriga bogʻliq boʻlmagan soʻzlar (mexanik xotira)
 * numbers  — ikki xonali sonlar
 * sentence — maʼnoli gap, soʻzma-soʻz koʻrsatiladi (mazmunli xotira)
 * Har bir til uchun alohida tuzilgan (tarjima emas).
 */
export interface MemorySet {
    id: string;
    lang: PsixoLang;
    kind: 'words' | 'numbers' | 'sentence';
    level: PsixoLevel;
    items: string[];
}

export const MEMORY_SETS: MemorySet[] = [
    // ── Oʻzbekcha: tasodifiy soʻzlar ──
    { id: 'uz-w1', lang: 'uz', kind: 'words', level: 2, items: ['olma', 'kitob', 'daryo', 'qalam', 'mushuk', 'deraza', 'togʻ', 'soat', 'gilam', 'bulut', 'choynak', 'oʻrik'] },
    { id: 'uz-w2', lang: 'uz', kind: 'words', level: 2, items: ['stol', 'yulduz', 'non', 'sumka', 'qor', 'eshik', 'baliq', 'gul', 'poyezd', 'oyna', 'qoshiq', 'shamol'] },
    { id: 'uz-w3', lang: 'uz', kind: 'words', level: 2, items: ['daraxt', 'telefon', 'tuz', 'ot', 'kalit', 'bozor', 'muz', 'koʻylak', 'quyosh', 'piyola', 'ari', 'gʻisht'] },
    { id: 'uz-w4', lang: 'uz', kind: 'words', level: 1, items: ['maktab', 'anor', 'koʻprik', 'sut', 'tulki', 'chiroq', 'qum', 'doʻppi', 'kema', 'asal'] },
    // ── Oʻzbekcha: sonlar ──
    { id: 'uz-n1', lang: 'uz', kind: 'numbers', level: 1, items: ['47', '12', '85', '39', '61', '23', '98', '54', '76', '31'] },
    { id: 'uz-n2', lang: 'uz', kind: 'numbers', level: 3, items: ['18', '72', '45', '93', '26', '64', '37', '81', '59', '14', '66', '29'] },
    // ── Oʻzbekcha: maʼnoli gaplar ──
    { id: 'uz-s1', lang: 'uz', kind: 'sentence', level: 1, items: ['Har', 'kuni', 'ertalab', 'bobom', 'bogʻdan', 'yangi', 'olma', 'terib', 'nevaralariga', 'savatda', 'olib', 'keladi'] },
    { id: 'uz-s2', lang: 'uz', kind: 'sentence', level: 1, items: ['Kuzda', 'qushlar', 'issiq', 'oʻlkalarga', 'uchib', 'ketadi', 'bahorda', 'esa', 'yana', 'qaytib', 'keladi'] },
    { id: 'uz-s3', lang: 'uz', kind: 'sentence', level: 2, items: ['Talaba', 'kutubxonadan', 'qiziqarli', 'kitob', 'olib', 'imtihonga', 'tayyorlanish', 'uchun', 'kechgacha', 'oʻqidi'] },
    { id: 'uz-s4', lang: 'uz', kind: 'sentence', level: 2, items: ['Yomgʻirdan', 'keyin', 'osmonda', 'chiroyli', 'kamalak', 'paydo', 'boʻldi', 'va', 'bolalar', 'quvonib', 'hovliga', 'yugurdi'] },

    // ── Русский: случайные слова ──
    { id: 'ru-w1', lang: 'ru', kind: 'words', level: 2, items: ['окно', 'лимон', 'гора', 'ключ', 'собака', 'тетрадь', 'облако', 'вилка', 'мост', 'чайник', 'звезда', 'ковёр'] },
    { id: 'ru-w2', lang: 'ru', kind: 'words', level: 2, items: ['стул', 'река', 'яблоко', 'часы', 'кошка', 'дверь', 'снег', 'рыба', 'поезд', 'зеркало', 'ложка', 'ветер'] },
    { id: 'ru-w3', lang: 'ru', kind: 'words', level: 2, items: ['дерево', 'телефон', 'соль', 'лошадь', 'рынок', 'лёд', 'рубашка', 'солнце', 'чашка', 'пчела', 'кирпич', 'шапка'] },
    { id: 'ru-w4', lang: 'ru', kind: 'words', level: 1, items: ['школа', 'гранат', 'сыр', 'лиса', 'лампа', 'песок', 'корабль', 'мёд', 'поле', 'флаг'] },
    // ── Русский: числа ──
    { id: 'ru-n1', lang: 'ru', kind: 'numbers', level: 1, items: ['52', '17', '88', '34', '69', '21', '95', '43', '77', '16'] },
    { id: 'ru-n2', lang: 'ru', kind: 'numbers', level: 3, items: ['28', '63', '91', '47', '15', '84', '39', '72', '56', '13', '68', '25'] },
    // ── Русский: осмысленные предложения ──
    { id: 'ru-s1', lang: 'ru', kind: 'sentence', level: 1, items: ['Утром', 'мама', 'испекла', 'пирог', 'и', 'пригласила', 'соседей', 'на', 'чай', 'в', 'саду'] },
    { id: 'ru-s2', lang: 'ru', kind: 'sentence', level: 1, items: ['Осенью', 'студенты', 'собрали', 'урожай', 'яблок', 'и', 'отвезли', 'его', 'в', 'городской', 'детский', 'дом'] },
    { id: 'ru-s3', lang: 'ru', kind: 'sentence', level: 2, items: ['Старый', 'рыбак', 'каждое', 'утро', 'выходил', 'на', 'лодке', 'в', 'море', 'ловить', 'рыбу'] },
    { id: 'ru-s4', lang: 'ru', kind: 'sentence', level: 2, items: ['После', 'урока', 'учитель', 'показал', 'ребятам', 'интересный', 'фильм', 'о', 'жизни', 'дельфинов'] },
];

/** "Psixolog-detektiv" va "Moslashtir" — 4–5-bosqichlarda toʻldiriladi. */
export const PSIXO_QUESTIONS: PsixoQuestion[] = [];

/** Tanlangan tildagi savollar: ruscha oʻyinga faqat ruscha matni toʻliq boʻlgan savollar tushadi. */
export function questionsFor(lang: PsixoLang, filter: { mode?: PsixoQuestion['mode']; topics?: PsixoTopic[]; levels?: PsixoLevel[] } = {}) {
    return PSIXO_QUESTIONS.filter(q =>
        (lang === 'uz' || (q.q.ru && q.options.ru && q.options.ru.length === q.options.uz.length && q.explain.ru))
        && (!filter.mode || q.mode === filter.mode)
        && (!filter.topics?.length || filter.topics.includes(q.topic))
        && (!filter.levels?.length || filter.levels.includes(q.level)));
}

export const memorySetsFor = (lang: PsixoLang, kind?: MemorySet['kind']) =>
    MEMORY_SETS.filter(s => s.lang === lang && (!kind || s.kind === kind));
