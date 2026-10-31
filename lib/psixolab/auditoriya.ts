// PsixoLab — "Auditoriya mashgʻulotlari / Аудиторные занятия": leksiya va praktika mavzulari.
// Matnlar oʻqituvchi tomonidan berilgan — oʻzgartirilmaydi, faqat tuzilmaga solingan.
// Oʻzbek matnida ʻ (U+02BB) va ʼ (U+02BC) belgilari saqlanadi.

export type AudLang = 'uz' | 'ru';
export interface L2 { uz: string; ru: string }

/** Tushuntirish bloki: oddiy xatboshi yoki roʻyxat. */
export type AudBlock = { p: string } | { ul: string[] };

export interface AudTest { q: L2; options: L2[]; answer: number }   // answer — "Javob:" qatoridagi variant (A=0)
export interface AudPair { left: L2; right: L2 }

export interface AudTopic {
    id: string;                      // 'L6', 'P1' ...
    kind: 'lecture' | 'practice';
    title: L2;
    explain: { uz: AudBlock[]; ru: AudBlock[] };
    concepts: { uz: string[]; ru: string[] };
    tests: AudTest[];
    pairs: AudPair[];
    caseTask: L2;
}

const opt = (uz: string, ru: string = uz): L2 => ({ uz, ru });

export const AUD_TOPICS: AudTopic[] = [
    {
        id: 'L6',
        kind: 'lecture',
        title: {
            uz: 'Bilish jarayonlari. Faoliyat. Motiv va motivatsiya',
            ru: 'Когнитивные процессы. Деятельность. Мотив и мотивация',
        },
        explain: {
            uz: [
                { p: 'Bilish jarayonlari — inson olamni aks ettiradigan psixik jarayonlar: sezgi, idrok, diqqat, xotira, tafakkur, xayol va nutq. Sezgi buyumning alohida xususiyatini (rang, tovush), idrok esa buyumni yaxlit aks ettiradi. Qisqa muddatli xotira hajmi oʻrtacha 7±2 birlik (J. Miller). Ebbingauz unutish egri chizigʻi materialning katta qismi dastlabki soatlarda unutilishini koʻrsatadi.' },
                { p: 'Faoliyat — ongli maqsadga yoʻnaltirilgan faollik. Asosiy turlari: oʻyin, oʻqish va mehnat. Faoliyat nazariyasini A. N. Leontev ishlab chiqqan.' },
                { p: 'Motiv — faoliyatga undovchi sabab; motivatsiya — motivlar tizimi. Ichki motivatsiya ishning oʻziga qiziqishdan, tashqi motivatsiya mukofot yoki jazodan kelib chiqadi. A. Maslou ehtiyojlar ierarxiyasi: fiziologik → xavfsizlik → mansublik va muhabbat → hurmat → oʻzini namoyon qilish. Yerks–Dodson qonuniga koʻra, eng yuqori natijaga oʻrtacha motivatsiyada erishiladi. Ongsiz motivlarni Z. Freyd oʻrgangan: inson ayrim harakatlarining sababini anglamasligi mumkin.' },
            ],
            ru: [
                { p: 'Когнитивные процессы — психические процессы отражения мира: ощущение, восприятие, внимание, память, мышление, воображение, речь. Ощущение отражает отдельное свойство предмета (цвет, звук), восприятие — предмет целиком. Объём кратковременной памяти в среднем 7±2 единицы (Дж. Миллер). Кривая забывания Эббингауза показывает, что большая часть материала забывается в первые часы.' },
                { p: 'Деятельность — активность, направленная на сознательную цель. Основные виды: игра, учение, труд. Теорию деятельности разработал А. Н. Леонтьев.' },
                { p: 'Мотив — побудительная причина деятельности; мотивация — система мотивов. Внутренняя мотивация исходит из интереса к самой деятельности, внешняя — из награды или наказания. Иерархия потребностей А. Маслоу: физиологические → безопасность → принадлежность и любовь → уважение → самоактуализация. По закону Йеркса–Додсона наилучший результат достигается при средней мотивации. Бессознательные мотивы изучал З. Фрейд: человек может не осознавать причины некоторых своих действий.' },
            ],
        },
        concepts: {
            uz: ['sezgi', 'idrok', 'diqqat', 'xotira', 'tafakkur', 'faoliyat', 'motiv', 'ichki/tashqi motivatsiya'],
            ru: ['ощущение', 'восприятие', 'внимание', 'память', 'мышление', 'деятельность', 'мотив', 'внутренняя/внешняя мотивация'],
        },
        tests: [
            {
                q: { uz: 'Qisqa muddatli xotiraning oʻrtacha hajmi?', ru: 'Средний объём кратковременной памяти?' },
                options: [opt('3±1'), opt('7±2'), opt('12±3'), opt('Cheksiz', 'Безграничен')],
                answer: 1,
            },
            {
                q: { uz: 'Maslou piramidasining eng yuqori pogʻonasi?', ru: 'Высшая ступень пирамиды Маслоу?' },
                options: [opt('Xavfsizlik', 'Безопасность'), opt('Hurmat', 'Уважение'), opt('Oʻzini namoyon qilish', 'Самоактуализация'), opt('Mansublik', 'Принадлежность')],
                answer: 2,
            },
            {
                q: { uz: 'Talaba dasturlashni qiziqqani uchun oʻrganadi. Bu qanday motivatsiya?', ru: 'Студент изучает программирование из интереса. Это какая мотивация?' },
                options: [opt('Tashqi', 'Внешняя'), opt('Ichki', 'Внутренняя'), opt('Salbiy', 'Отрицательная'), opt('Ongsiz', 'Бессознательная')],
                answer: 1,
            },
            {
                q: { uz: 'Buyumni yaxlit aks ettiruvchi jarayon?', ru: 'Процесс целостного отражения предмета?' },
                options: [opt('Sezgi', 'Ощущение'), opt('Idrok', 'Восприятие'), opt('Xayol', 'Воображение'), opt('Nutq', 'Речь')],
                answer: 1,
            },
            {
                q: { uz: 'Yerks–Dodson qonuniga koʻra eng yaxshi natija qachon boʻladi?', ru: 'По закону Йеркса–Додсона лучший результат достигается при…' },
                options: [opt('Juda past motivatsiyada', 'Очень низкой мотивации'), opt('Oʻrtacha motivatsiyada', 'Средней мотивации'), opt('Juda yuqori motivatsiyada', 'Очень высокой мотивации'), opt('Motivatsiyasiz', 'Без мотивации')],
                answer: 1,
            },
        ],
        pairs: [
            { left: opt('A. N. Leontev', 'А. Н. Леонтьев'), right: opt('Faoliyat nazariyasi', 'Теория деятельности') },
            { left: opt('A. Maslou', 'А. Маслоу'), right: opt('Ehtiyojlar ierarxiyasi', 'Иерархия потребностей') },
            { left: opt('G. Ebbingauz', 'Г. Эббингауз'), right: opt('Unutish egri chizigʻi', 'Кривая забывания') },
            { left: opt('J. Miller', 'Дж. Миллер'), right: opt('Xotira hajmi 7±2', 'Объём памяти 7±2') },
            { left: opt('Z. Freyd', 'З. Фрейд'), right: opt('Ongsiz motivlar', 'Бессознательные мотивы') },
        ],
        caseTask: {
            uz: 'Talaba Aziz semestr boshida aʼlo oʻqidi, lekin hozir darslarga kelmayapti. Uning aytishicha, "baho baribir hech narsani hal qilmaydi", u esa kechasi frilans buyurtmalar bajaryapti. Azizning motivatsiyasini Maslou piramidasi va ichki/tashqi motivatsiya nuqtayi nazaridan tahlil qiling. Oʻqituvchi sifatida qanday 3 ta qadam qoʻyasiz?',
            ru: 'Студент Азиз в начале семестра учился отлично, но сейчас не ходит на занятия. По его словам, «оценка всё равно ничего не решает», а ночью он выполняет фриланс-заказы. Проанализируйте мотивацию Азиза с точки зрения пирамиды Маслоу и внутренней/внешней мотивации. Какие 3 шага вы предпримете как преподаватель?',
        },
    },
];

/** Ballar: test — har bir toʻgʻri javob 1 ball; moslashtirish — 5 dan xatolar soni ayiriladi; keys — oʻqituvchi 0–10. */
export const CASE_MAX = 10;

export const audTopic = (id: string) => AUD_TOPICS.find(t => t.id === id);
