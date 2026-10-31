// PsixoLab — "Moslashtir": olim ↔ nazariya, tushuncha ↔ taʼrif, tur ↔ misol.
// Har toʻplam bitta ID ostida uz va ru da; ru matni toʻliq boʻlmagan toʻplam ruscha oʻyinga tushmaydi.
// Oʻyinda har toʻplam — bitta raund; oʻng ustun har talabaga boshqa tartibda chiqadi.

import type { CodeRace, CodeRacer } from '../codeRace';
import { playerOrder } from '../engRace';
import type { PsixoLang, PsixoLevel } from './questions';

interface L2 { uz: string; ru?: string }
export interface MatchSet {
    id: string;
    kind: 'olim' | 'tushuncha' | 'misol';
    level: PsixoLevel;
    title: L2;
    pairs: { left: L2; right: L2 }[];
}

const p = (lu: string, lr: string, ru_: string, rr: string) => ({ left: { uz: lu, ru: lr }, right: { uz: ru_, ru: rr } });

export const MATCH_SETS: MatchSet[] = [
    {
        id: 'm-olim-1', kind: 'olim', level: 1,
        title: { uz: 'Olim ↔ nazariya (1)', ru: 'Учёный ↔ теория (1)' },
        pairs: [
            p('I. P. Pavlov', 'И. П. Павлов', 'Shartli refleks', 'Условный рефлекс'),
            p('L. S. Vygotskiy', 'Л. С. Выготский', 'Yaqin rivojlanish zonasi', 'Зона ближайшего развития'),
            p('J. Piaget', 'Ж. Пиаже', 'Intellekt rivojlanishining bosqichlari', 'Стадии интеллектуального развития'),
            p('G. Ebbingauz', 'Г. Эббингауз', 'Unutish egri chizigʻi', 'Кривая забывания'),
            p('A. Maslou', 'А. Маслоу', 'Ehtiyojlar ierarxiyasi', 'Иерархия потребностей'),
        ],
    },
    {
        id: 'm-olim-2', kind: 'olim', level: 2,
        title: { uz: 'Olim ↔ nazariya (2)', ru: 'Учёный ↔ теория (2)' },
        pairs: [
            p('Ya. A. Komenskiy', 'Я. А. Коменский', '“Buyuk didaktika”, sinf-dars tizimi', '«Великая дидактика», классно-урочная система'),
            p('K. D. Ushinskiy', 'К. Д. Ушинский', '“Inson tarbiya predmeti sifatida”', '«Человек как предмет воспитания»'),
            p('J. Miller', 'Дж. Миллер', 'Qisqa muddatli xotira hajmi 7±2', 'Объём кратковременной памяти 7±2'),
            p('A. N. Leontev', 'А. Н. Леонтьев', 'Faoliyat nazariyasi', 'Теория деятельности'),
            p('Z. Freyd', 'З. Фрейд', 'Psixoanaliz va himoya mexanizmlari', 'Психоанализ и защитные механизмы'),
        ],
    },
    {
        id: 'm-tush-1', kind: 'tushuncha', level: 1,
        title: { uz: 'Bilish jarayonlari ↔ taʼrif', ru: 'Познавательные процессы ↔ определение' },
        pairs: [
            p('Sezgi', 'Ощущение', 'Buyumning alohida xususiyatini aks ettirish', 'Отражение отдельного свойства предмета'),
            p('Idrok', 'Восприятие', 'Buyumni yaxlit aks ettirish', 'Целостное отражение предмета'),
            p('Diqqat', 'Внимание', 'Ongning biror obyektga yoʻnaltirilishi va toʻplanishi', 'Направленность и сосредоточенность сознания на объекте'),
            p('Tafakkur', 'Мышление', 'Voqelikni umumlashgan va bilvosita aks ettirish', 'Обобщённое и опосредованное отражение действительности'),
            p('Xayol', 'Воображение', 'Yangi obrazlar yaratish jarayoni', 'Процесс создания новых образов'),
        ],
    },
    {
        id: 'm-tush-2', kind: 'tushuncha', level: 2,
        title: { uz: 'Shaxs va pedagogika ↔ taʼrif', ru: 'Личность и педагогика ↔ определение' },
        pairs: [
            p('Didaktika', 'Дидактика', 'Taʼlim va oʻqitish nazariyasi', 'Теория образования и обучения'),
            p('Motiv', 'Мотив', 'Faoliyatga undovchi sabab', 'Побудительная причина деятельности'),
            p('Temperament', 'Темперамент', 'Psixik faoliyatning dinamik xususiyatlari', 'Динамические особенности психической деятельности'),
            p('Xarakter', 'Характер', 'Shaxsning barqaror xulq-atvor xususiyatlari majmui', 'Совокупность устойчивых черт поведения личности'),
            p('Qobiliyat', 'Способности', 'Faoliyatni muvaffaqiyatli bajarish shartlari boʻlgan xususiyatlar', 'Свойства, обеспечивающие успешность деятельности'),
        ],
    },
    {
        id: 'm-misol-1', kind: 'misol', level: 2,
        title: { uz: 'Xotira va tafakkur turi ↔ misol', ru: 'Вид памяти и мышления ↔ пример' },
        pairs: [
            p('Mexanik xotira', 'Механическая память', 'Telefon raqamini maʼnosiz takrorlab yodlash', 'Заучивание номера телефона простым повторением'),
            p('Emotsional xotira', 'Эмоциональная память', 'Birinchi imtihondagi hayajonni yillar oʻtib ham eslash', 'Спустя годы помнить волнение на первом экзамене'),
            p('Harakat xotirasi', 'Двигательная память', 'Yillar oʻtsa ham velosiped haydashni unutmaslik', 'Не разучиться ездить на велосипеде спустя годы'),
            p('Koʻrgazmali-obrazli tafakkur', 'Наглядно-образное мышление', 'Masalani rasm chizib, tasavvur qilib yechish', 'Решать задачу, рисуя и представляя её'),
            p('Soʻz-mantiqiy tafakkur', 'Словесно-логическое мышление', 'Teoremani taʼrif va isbotlar orqali yechish', 'Доказывать теорему через определения и логику'),
        ],
    },
    {
        id: 'm-misol-2', kind: 'misol', level: 1,
        title: { uz: 'Usul va metod ↔ misol', ru: 'Метод ↔ пример' },
        pairs: [
            p('Ragʻbatlantirish', 'Поощрение', 'Faol talabani guruh oldida maqtash', 'Похвалить активного студента перед группой'),
            p('Ishontirish', 'Убеждение', 'Dalillar bilan xulqning zararini tushuntirish', 'Аргументированно объяснить вред поступка'),
            p('Mashq (odatlantirish)', 'Упражнение (приучение)', 'Har kuni xonani tartibga keltirishga odatlantirish', 'Каждый день приучать наводить порядок в аудитории'),
            p('Aqliy hujum', 'Мозговой штурм', 'Tanqidsiz, imkon qadar koʻp gʻoya toʻplash', 'Собрать как можно больше идей без критики'),
            p('Keys-stadi', 'Кейс-стади', 'Real vaziyatni tahlil qilib yechim topish', 'Анализ реальной ситуации и поиск решения'),
        ],
    },
];

export const MATCH_KIND_NAMES: Record<MatchSet['kind'], Record<PsixoLang, string>> = {
    olim: { uz: 'Olim ↔ nazariya', ru: 'Учёный ↔ теория' },
    tushuncha: { uz: 'Tushuncha ↔ taʼrif', ru: 'Понятие ↔ определение' },
    misol: { uz: 'Tur ↔ misol', ru: 'Вид ↔ пример' },
};

/** Ruscha oʻyinga faqat toʻliq tarjimasi bor toʻplamlar. */
export const matchSetsFor = (lang: PsixoLang) =>
    MATCH_SETS.filter(s => lang === 'uz' || (s.title.ru && s.pairs.every(x => x.left.ru && x.right.ru)));

/* ───────────── Oʻyin mexanikasi (race engine: kind = 'match') ───────────── */

export interface MatchRound { title: string; pairs: { left: string; right: string }[] }
export interface MatchConfig { rounds: MatchRound[]; penaltySec: number }

export const matchTotal = (m: MatchConfig) => m.rounds.reduce((n, r) => n + r.pairs.length, 0);

export function sanitizeMatch(input: unknown, penalty: unknown): { match?: MatchConfig; error?: string } {
    if (!Array.isArray(input) || input.length === 0 || input.length > 12) return { error: '1–12 ta raund kerak' };
    const rounds: MatchRound[] = [];
    for (const r of input) {
        const pairs = (Array.isArray(r?.pairs) ? r.pairs : []).slice(0, 8)
            .map((x: any) => ({ left: String(x?.left ?? '').trim().slice(0, 120), right: String(x?.right ?? '').trim().slice(0, 200) }))
            .filter((x: { left: string; right: string }) => x.left && x.right);
        if (pairs.length < 2) return { error: 'Har raundda kamida 2 ta juftlik kerak' };
        if (new Set(pairs.map((x: { right: string }) => x.right)).size !== pairs.length) return { error: 'Raund ichida taʼriflar takrorlanmasin' };
        rounds.push({ title: String(r?.title ?? '').slice(0, 80), pairs });
    }
    const penaltySec = [0, 3, 5, 10].includes(Number(penalty)) ? Number(penalty) : 5;
    return { match: { rounds, penaltySec } };
}

/** Talabaning hozirgi raundi: birinchi toʻliq moslashtirilmagan raund. */
export function currentRoundIndex(m: MatchConfig, racer: CodeRacer): number {
    const done = new Set(racer.matched ?? []);
    return m.rounds.findIndex((r, ri) => r.pairs.some((_, i) => !done.has(`${ri}:${i}`)));
}

/** Talabaga: chap ustun asl tartibda, oʻng ustun — oʻziga xos aralash tartibda (javob kaliti yuborilmaydi). */
export function publicRound(race: CodeRace, racer: CodeRacer) {
    const m = race.match;
    if (!m) return null;
    const ri = currentRoundIndex(m, racer);
    if (ri < 0) return null;
    const r = m.rounds[ri];
    const done = new Set(racer.matched ?? []);
    return {
        index: ri, count: m.rounds.length, title: r.title,
        lefts: r.pairs.map(x => x.left),
        rights: playerOrder(`${racer.id}:${ri}`, r.pairs.length).map(i => r.pairs[i].right),
        matched: r.pairs.map((_, i) => done.has(`${ri}:${i}`)),
        matchedRights: r.pairs.filter((_, i) => done.has(`${ri}:${i}`)).map(x => x.right),
    };
}
