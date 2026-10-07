import type { CodeTask } from './codeRace';

/** "Python asoslari" — tayyor namuna to'plam (oson → qiyin). */
export const SAMPLE_TASKS: CodeTask[] = [
    {
        title: 'Salomlashish',
        prompt: "Ismni qabul qilib, \"Salom, <ism>!\" matnini qaytaruvchi funksiya yozing.",
        functionName: 'salom',
        starter: 'def salom(ism):\n    # kodingizni shu yerga yozing\n    pass\n',
        tests: [
            { args: ['Ali'], expected: 'Salom, Ali!' },
            { args: ['Zukkoo'], expected: 'Salom, Zukkoo!' },
            { args: ['Dunyo'], expected: 'Salom, Dunyo!' },
        ],
    },
    {
        title: 'Juft yoki toq',
        prompt: "Son juft bo'lsa True, toq bo'lsa False qaytaring.",
        functionName: 'juftmi',
        starter: 'def juftmi(n):\n    pass\n',
        tests: [
            { args: [4], expected: true },
            { args: [7], expected: false },
            { args: [0], expected: true },
            { args: [-3], expected: false },
        ],
    },
    {
        title: "Raqamlar yig'indisi",
        prompt: "Musbat butun sonning raqamlari yig'indisini qaytaring. Masalan: 123 → 1 + 2 + 3 = 6.",
        functionName: 'raqamlar_yigindisi',
        starter: 'def raqamlar_yigindisi(n):\n    pass\n',
        tests: [
            { args: [123], expected: 6 },
            { args: [9], expected: 9 },
            { args: [1001], expected: 2 },
            { args: [98765], expected: 35 },
        ],
    },
    {
        title: 'Eng katta son',
        prompt: "Sonlar ro'yxatidagi eng katta sonni qaytaring. max() funksiyasisiz urinib ko'ring!",
        functionName: 'eng_katta',
        starter: 'def eng_katta(sonlar):\n    pass\n',
        tests: [
            { args: [[3, 9, 2]], expected: 9 },
            { args: [[-5, -1, -9]], expected: -1 },
            { args: [[7]], expected: 7 },
            { args: [[4, 4, 1, 4]], expected: 4 },
        ],
    },
    {
        title: 'Palindrom',
        prompt: "So'z teskarisiga o'qilganda ham bir xil bo'lsa True qaytaring. Katta-kichik harf farq qilmaydi (\"Anna\" → True).",
        functionName: 'palindrommi',
        starter: 'def palindrommi(soz):\n    pass\n',
        tests: [
            { args: ['kiyik'], expected: true },
            { args: ['olma'], expected: false },
            { args: ['Anna'], expected: true },
            { args: ['a'], expected: true },
        ],
    },
    {
        title: 'FizzBuzz',
        prompt: "1 dan n gacha bo'lgan ro'yxat qaytaring, lekin 3 ga bo'linadiganlar o'rniga \"Fizz\", 5 ga — \"Buzz\", ikkalasiga — \"FizzBuzz\" yozing.",
        functionName: 'fizzbuzz',
        starter: 'def fizzbuzz(n):\n    natija = []\n    # ...\n    return natija\n',
        tests: [
            { args: [5], expected: [1, 2, 'Fizz', 4, 'Buzz'] },
            { args: [1], expected: [1] },
            { args: [15], expected: [1, 2, 'Fizz', 4, 'Buzz', 'Fizz', 7, 8, 'Fizz', 'Buzz', 11, 'Fizz', 13, 14, 'FizzBuzz'] },
        ],
    },
];

/** Tashqi AI'da (ChatGPT, Claude, Gemini) masala tayyorlatish uchun prompt. */
export const TASKS_PROMPT = (topic: string, count: number) => `"${topic}" mavzusida universitet talabalari uchun ${count} ta Python dasturlash masalasi tuz. Masalalar osondan qiyinga qarab borsin.
Har bir masala bitta funksiya yozishni talab qilsin (input() va print() emas — qiymat return qilinsin).
Javobni FAQAT JSON massiv ko'rinishida, boshqa hech qanday matnsiz qaytar:
[
  {
    "title": "Qisqa nom",
    "prompt": "Masala sharti o'zbek tilida, misol bilan",
    "functionName": "funksiya_nomi",
    "starter": "def funksiya_nomi(param):\\n    pass\\n",
    "tests": [
      { "args": [birinchi_argument], "expected": kutilgan_natija },
      { "args": [...], "expected": ... }
    ]
  }
]
Har bir masalada 3–5 ta test bo'lsin, chekka holatlar ham (bo'sh ro'yxat, 0, manfiy son). "args" — funksiyaga beriladigan argumentlar ro'yxati. Natijalar faqat JSON turlari bo'lsin (son, matn, true/false, ro'yxat, lug'at). Testlardagi javoblar 100% to'g'ri ekanini tekshir.`;
