import type { EngQuestion } from './engRace';

const mc = (topic: string, q: string, options: string[], answer: string, explain: string): EngQuestion =>
    ({ topic, q, options, answer, explain });
const typed = (topic: string, q: string, answer: string, explain: string, accept?: string[]): EngQuestion =>
    ({ topic, q, answer, explain, accept });

/** B1 darajadagi tayyor to'plam: to be, zamonlar, asosiy grammatika (oson → o'rta). */
export const SAMPLE_ENG: EngQuestion[] = [
    // To be
    mc('To be', 'My parents ___ teachers.', ['is', 'are', 'am', 'be'], 'are', "Ko'plik (they) bilan — are."),
    mc('To be', 'I ___ very tired yesterday.', ['am', 'were', 'was', 'be'], 'was', "O'tgan zamon, I bilan — was."),
    mc('To be', 'Where ___ you last weekend?', ['was', 'were', 'are', 'did'], 'were', "You bilan o'tgan zamonda har doim were."),
    mc('To be', 'She ___ at home right now.', ['is', 'are', 'was', 'be'], 'is', 'Hozirgi holat, she bilan — is.'),
    typed('To be', "There ___ a lot of students in the hall yesterday. (to be)", 'were', "Students — ko'plik, o'tgan zamon: were."),
    typed('To be', "___ your brother at university now? (to be)", 'is', 'Savol, he/she bilan hozirgi zamon: Is.'),

    // Present Simple / Continuous
    mc('Present Simple', 'He usually ___ to work by bus.', ['go', 'goes', 'is going', 'going'], 'goes', 'Odat (usually) + he → -s qo\'shimchasi: goes.'),
    mc('Present Simple', "She ___ like coffee.", ["don't", "doesn't", "isn't", "not"], "doesn't", "Present Simple inkori he/she/it bilan — doesn't."),
    mc('Present Continuous', 'Look! It ___.', ['rains', 'is raining', 'rained', 'rain'], 'is raining', "Look! — hozir sodir bo'layotgan ish: Present Continuous."),
    mc('Present Continuous', 'What ___ you doing now?', ['do', 'are', 'is', 'does'], 'are', 'Present Continuous savoli: are + you + -ing.'),
    mc('Present Simple', 'Water ___ at 100 degrees Celsius.', ['boils', 'is boiling', 'boil', 'boiled'], 'boils', 'Umumiy haqiqat — Present Simple.'),
    typed('Present Simple', 'My sister ___ (study) English every day.', 'studies', 'He/she + study → studies (y → ies).'),

    // Past Simple / Continuous
    mc('Past Simple', 'We ___ a great film last night.', ['see', 'saw', 'seen', 'have seen'], 'saw', 'Last night — Past Simple; see → saw.'),
    mc('Past Simple', 'Did you ___ your homework?', ['finished', 'finish', 'finishing', 'finishes'], 'finish', "Did dan keyin fe'lning 1-shakli keladi."),
    mc('Past Continuous', 'I ___ TV when you called me.', ['watched', 'was watching', 'am watching', 'watch'], 'was watching', "Uzoq davom etgan ish (was watching) qisqa ish (called) bilan bo'lindi."),
    mc('Past Continuous', 'They ___ football at 5 pm yesterday.', ['were playing', 'played', 'are playing', 'was playing'], 'were playing', "Aniq vaqtda davom etayotgan o'tgan ish — Past Continuous, they → were."),
    typed('Past Simple', 'She ___ (buy) a new phone last week.', 'bought', 'Buy — noto\'g\'ri fe\'l: buy → bought.'),
    typed('Past Simple', 'I ___ (not / go) to school yesterday.', "didn't go", "Past Simple inkori: didn't + fe'lning 1-shakli.", ['did not go']),

    // Present Perfect
    mc('Present Perfect', 'I ___ never been to London.', ['has', 'have', 'had', 'am'], 'have', 'I + have + V3 (been).'),
    mc('Present Perfect', 'She has already ___ her lunch.', ['eat', 'ate', 'eaten', 'eating'], 'eaten', 'Present Perfect: has + V3 → eaten.'),
    mc('Present Perfect', 'We have lived here ___ 2015.', ['for', 'since', 'from', 'ago'], 'since', "Boshlanish nuqtasi (yil) bilan — since; davomiylik bilan — for."),
    mc('Present Perfect', 'Have you ever ___ sushi?', ['try', 'tried', 'tries', 'trying'], 'tried', 'Have + V3: try → tried.'),
    typed('Present Perfect', "He has ___ (write) three books.", 'written', 'Write — noto\'g\'ri fe\'l: write → wrote → written.'),

    // Future
    mc('Future', 'Look at those clouds! It ___ rain.', ['will', 'is going to', 'goes to', 'shall'], 'is going to', "Ko'rinib turgan dalilga asoslangan bashorat — be going to."),
    mc('Future', "I'm tired. I think I ___ go to bed.", ['will', 'am going', 'going to', 'go'], 'will', "Shu zahoti qabul qilingan qaror — will."),
    mc('Future', 'Next year she ___ 20 years old.', ['is', 'will be', 'was', 'be'], 'will be', 'Kelasi yil — kelasi zamon: will be.'),

    // Comparatives / Superlatives
    mc('Comparatives', 'This book is ___ than that one.', ['interesting', 'more interesting', 'most interesting', 'interestinger'], 'more interesting', "Uzun sifat: more + sifat + than."),
    mc('Superlatives', 'Everest is ___ mountain in the world.', ['the highest', 'higher', 'the most high', 'highest'], 'the highest', 'Eng yuqori daraja: the + -est.'),
    mc('Comparatives', 'My car is ___ than yours.', ['gooder', 'better', 'best', 'more good'], 'better', "Good — noto'g'ri: good → better → the best."),

    // Articles, quantifiers, prepositions
    mc('Articles', 'She is ___ honest person.', ['a', 'an', 'the', '—'], 'an', "Honest unli tovush bilan boshlanadi (h o'qilmaydi) → an."),
    mc('Quantifiers', 'How ___ money do you have?', ['many', 'much', 'a lot', 'few'], 'much', "Sanalmaydigan ot (money) bilan — much."),
    mc('Quantifiers', 'There aren\'t ___ apples in the fridge.', ['some', 'any', 'much', 'no'], 'any', "Inkor gapda — any."),
    mc('Prepositions', 'My birthday is ___ May.', ['on', 'at', 'in', 'by'], 'in', 'Oylar bilan — in.'),
    mc('Prepositions', 'The lesson starts ___ 9 o\'clock.', ['in', 'on', 'at', 'for'], 'at', 'Aniq soat bilan — at.'),

    // Modals, passive, conditionals, question tags
    mc('Modals', 'You ___ smoke here. It\'s forbidden.', ["mustn't", "don't have to", "needn't", "can"], "mustn't", "Taqiq — mustn't; don't have to — majburiy emas degani."),
    mc('Modals', '___ you help me, please?', ['Must', 'Could', 'Should', 'Have'], 'Could', "Muloyim iltimos — Could you...?"),
    mc('Passive', 'This bridge ___ in 1990.', ['built', 'was built', 'is building', 'has build'], 'was built', "O'tgan zamon majhul nisbat: was/were + V3."),
    mc('Conditionals', 'If it rains tomorrow, we ___ at home.', ['stay', 'will stay', 'would stay', 'stayed'], 'will stay', "1-shart gap: If + Present Simple, will + fe'l."),
    mc('Conditionals', 'If I ___ rich, I would travel the world.', ['am', 'was', 'were', 'will be'], 'were', "2-shart gap (xayoliy): If + were, would + fe'l."),
    mc('Question tags', "She's a student, ___?", ["isn't she", "is she", "doesn't she", "wasn't she"], "isn't she", "Tasdiq gapdan keyin inkor so'roq: isn't she?"),
    typed('Passive', 'English ___ (speak) all over the world.', 'is spoken', "Hozirgi zamon majhul nisbat: is + V3 (spoken)."),
];

/** Tashqi AI'da savol tayyorlatish uchun prompt. */
export const ENG_PROMPT = (topic: string, count: number) => `Ingliz tili filologiyasi talabalari uchun "${topic}" mavzusida ${count} ta B1 darajadagi grammatika savoli tuz.
Savollarning ko'pi 4 variantli bo'lsin, ba'zilari esa talaba o'zi yozadigan (variantsiz) bo'lsin.
Javobni FAQAT JSON massiv ko'rinishida, boshqa hech qanday matnsiz qaytar:
[
  { "topic": "Past Simple", "q": "We ___ a great film last night.", "options": ["see", "saw", "seen", "have seen"], "answer": "saw", "explain": "Last night — Past Simple; see → saw." },
  { "topic": "Present Perfect", "q": "He has ___ (write) three books.", "answer": "written", "explain": "write → wrote → written." }
]
Qoidalar: bo'sh joy "___" bilan belgilansin; "answer" variantlardan biri bilan aynan bir xil bo'lsin; har bir savolda faqat bitta to'g'ri javob bo'lsin; "explain" — o'zbek tilida, qisqa (1 gap). Javoblar 100% to'g'ri ekanini tekshir.`;
