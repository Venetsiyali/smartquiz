// MasofaLab — "Masofaviy taʼlim texnologiyalari" (sirtqi, auditoriya mavzulari). Faqat oʻzbek tilida.
// Matnlar oʻqituvchi tomonidan berilgan — oʻzgartirilmaydi, faqat tuzilmaga solingan.
// Oʻzbek matnida ʻ (U+02BB) va ʼ (U+02BC) belgilari saqlanadi.

/** Qadam dalili: none — yoʻq, link — havola, screenshot — skrinshot (havola koʻrinishida qabul qilinadi). */
export type Evidence = 'none' | 'link' | 'screenshot';
export interface MissionStep { text: string; evidence: Evidence }
export interface MissionTest { q: string; options: string[]; answer: number }   // answer — "Javob:" qatoridagi variant (A=0)
export interface Mission {
    code: string;
    title: string;
    goal: string;
    info?: string;
    steps: MissionStep[];
    test: MissionTest[];
}

/** Umumiy talab (missiya kartasida koʻrsatiladi). */
export const MISSION_REQUIREMENT = "talabalarda Google akkaunti boʻlishi kerak. A5 uchun universitet Microsoft 365 akkaunti kerak.";
/** Qoʻshimcha talab boʻlgan missiyalar. */
export const MISSION_NOTES: Record<string, string> = { A5: 'Universitet Microsoft 365 akkaunti kerak.' };

export const MISSIONS: Mission[] = [
    {
        "code": "M1",
        "title": "Fanning vazifasi, tarixi, strukturasi va tarkibi",
        "goal": "masofaviy taʼlimning rivojlanish bosqichlarini bilish va ularni zamonaviy vositalar bilan bogʻlash.",
        "info": "Masofaviy taʼlim pochta orqali sirtqi oʻqitishdan boshlangan: 1840-yilda I. Pitman stenografiyani xatlar orqali oʻrgatgan. 1858-yilda London universiteti tashqi talabalar dasturini ochgan, 1969-yilda Buyuk Britaniyada Ochiq universitet tashkil etilgan. Keyin radio va televideniye davri, 1990-yillardan internet va LMS tizimlari keldi. 2008-yilda MOOC atamasi paydo boʻldi, 2012-yildan Coursera va edX kabi platformalar keng tarqaldi.",
        "steps": [
            {
                "text": "Guruhlarga boʻlining (4 kishidan). Har guruhga bitta davr beriladi: pochta, radio/TV, internet/LMS, MOOC/SI.",
                "evidence": "none"
            },
            {
                "text": "Davringiz boʻyicha 3 ta faktni toping: yil, texnologiya, misol.",
                "evidence": "none"
            },
            {
                "text": "Oʻqituvchi bergan umumiy Google Slides'da oʻz davringizga bitta slayd tayyorlang.",
                "evidence": "link"
            },
            {
                "text": "Davringizdagi texnologiyaning bugungi \"vorisi\"ni yozing (masalan, pochta → elektron pochta va LMS xabarlari).",
                "evidence": "none"
            },
            {
                "text": "Guruh vakili 1 daqiqada slaydni taqdim etadi.",
                "evidence": "none"
            }
        ],
        "test": [
            {
                "q": "Ochiq universitet (Buyuk Britaniya) qachon tashkil etilgan?",
                "options": [
                    "1858",
                    "1969",
                    "1995",
                    "2012"
                ],
                "answer": 1
            },
            {
                "q": "MOOC nimani anglatadi?",
                "options": [
                    "Ommaviy ochiq onlayn kurs",
                    "Mobil oflayn oʻquv kursi",
                    "Moodle kursi",
                    "Masofaviy oʻqituvchi kursi"
                ],
                "answer": 0
            },
            {
                "q": "Masofaviy taʼlimning eng birinchi shakli qaysi?",
                "options": [
                    "Televideniye",
                    "Pochta orqali sirtqi oʻqitish",
                    "Vebinar",
                    "LMS"
                ],
                "answer": 1
            },
            {
                "q": "Coursera va edX qaysi davrga mansub?",
                "options": [
                    "Radio",
                    "Pochta",
                    "MOOC",
                    "Televideniye"
                ],
                "answer": 2
            }
        ]
    },
    {
        "code": "M3",
        "title": "Oʻquv jarayonining tashkiliy tuzilmasi: talaba va oʻqituvchining roli",
        "goal": "masofaviy taʼlim ishtirokchilarining vazifalarini farqlash.",
        "info": "Masofaviy taʼlimda oʻqituvchi bilim \"uzatuvchi\" emas, balki kurs muallifi, tyutor, fasilitator va moderator vazifalarini bajaradi. Talabadan mustaqillik, vaqtni boshqarish va oʻz-oʻzini nazorat qilish talab etiladi. Jarayonda administrator (kurs va akkauntlar) hamda texnik yordam xizmati ham ishtirok etadi.",
        "steps": [
            {
                "text": "Oʻqituvchi 4 ta rol kartasini beradi: talaba, oʻqituvchi-tyutor, administrator, texnik yordam. Har juftlik bitta rol oladi.",
                "evidence": "none"
            },
            {
                "text": "Rolingizning 3 ta asosiy vazifasini yozing.",
                "evidence": "none"
            },
            {
                "text": "Vaziyat: \"Talaba topshiriqni muddatida yubora olmadi, sababi — platformaga kira olmadi.\" Sizning rolingiz bu vaziyatda nima qiladi? 2–3 jumla yozing.",
                "evidence": "none"
            },
            {
                "text": "Umumiy jadvalga (Google Sheets) rolingiz qatorini toʻldiring: vazifalar | masʼuliyat | vaziyatdagi harakat.",
                "evidence": "link"
            },
            {
                "text": "Butun guruh jadvalni koʻrib chiqadi: qaysi vazifa ikki rolda takrorlanmoqda?",
                "evidence": "none"
            }
        ],
        "test": [
            {
                "q": "Masofaviy taʼlimda oʻqituvchining asosiy yangi roli?",
                "options": [
                    "Faqat maʼruza oʻqish",
                    "Fasilitator va tyutor",
                    "Faqat baholash",
                    "Texnik xizmat"
                ],
                "answer": 1
            },
            {
                "q": "Talabadan eng koʻp talab qilinadigan sifat?",
                "options": [
                    "Mustaqillik va vaqtni boshqarish",
                    "Kuchli kompyuter",
                    "Kamera sifati",
                    "Dasturlash bilimi"
                ],
                "answer": 0
            },
            {
                "q": "LMS'da akkaunt va kurslarni kim boshqaradi?",
                "options": [
                    "Talaba",
                    "Administrator",
                    "Tyutor",
                    "Ota-ona"
                ],
                "answer": 1
            },
            {
                "q": "Fasilitator nima qiladi?",
                "options": [
                    "Javobni aytib beradi",
                    "Muhokamani yoʻnaltiradi va faollashtiradi",
                    "Baho qoʻymaydi",
                    "Faqat test tuzadi"
                ],
                "answer": 1
            }
        ]
    },
    {
        "code": "M7",
        "title": "Interaktiv pedagogik yondashuvlar: fasilitatsiya, diskussiya, guruh ishlari",
        "goal": "onlayn muhokamani tashkil etish va boshqarishni amalda sinab koʻrish.",
        "info": "\"Izlanuvchan hamjamiyat\" modeli (Garrison, Anderson, Archer) boʻyicha onlayn taʼlim sifati uch \"hozirlik\"ka bogʻliq: ijtimoiy (ishtirokchilar bir-birini his qiladi), kognitiv (fikrlash va bilim qurish) va oʻqituvchi hozirligi (yoʻnaltirish). Yaxshi onlayn muhokamaning asosiy belgilari: ochiq savol, aniq qoidalar va javoblarga javob yozish (faqat \"qoʻshilaman\" emas).",
        "steps": [
            {
                "text": "Oʻqituvchi Padlet devoriga havola beradi. Muhokama savoli: \"Sirtqi talaba uchun eng katta toʻsiq nima va uni qanday yengish mumkin?\"",
                "evidence": "none"
            },
            {
                "text": "Oʻz javobingizni 3–4 jumlada yozing.",
                "evidence": "none"
            },
            {
                "text": "Ikki kursdoshingiz postiga mazmunli javob yozing: savol bering yoki misol qoʻshing.",
                "evidence": "none"
            },
            {
                "text": "Har guruhdan bitta fasilitator tanlanadi. U 3 daqiqada muhokamani umumlashtirib, 3 ta asosiy fikrni ajratadi.",
                "evidence": "none"
            },
            {
                "text": "Oʻzingizning bitta postingiz skrinshotini yuklang.",
                "evidence": "screenshot"
            }
        ],
        "test": [
            {
                "q": "\"Izlanuvchan hamjamiyat\" modelidagi uch hozirlik?",
                "options": [
                    "Ijtimoiy, kognitiv, oʻqituvchi",
                    "Video, audio, matn",
                    "Talaba, ota-ona, oʻqituvchi",
                    "Test, imtihon, baho"
                ],
                "answer": 0
            },
            {
                "q": "Onlayn muhokama uchun eng yaxshi savol turi?",
                "options": [
                    "\"Ha/yoʻq\" savol",
                    "Ochiq, munozarali savol",
                    "Faktni eslash savoli",
                    "Savolsiz muhokama"
                ],
                "answer": 1
            },
            {
                "q": "Mazmunli javobga misol?",
                "options": [
                    "\"Qoʻshilaman\"",
                    "\"👍\"",
                    "Fikrga misol yoki savol qoʻshish",
                    "Postni koʻchirib yozish"
                ],
                "answer": 2
            },
            {
                "q": "Fasilitatorning vazifasi?",
                "options": [
                    "Muhokamani yoʻnaltirish va umumlashtirish",
                    "Hammaga baho qoʻyish",
                    "Postlarni oʻchirish",
                    "Jim turish"
                ],
                "answer": 0
            }
        ]
    },
    {
        "code": "M10",
        "title": "Onlayn leksiya va vebinarlar tashkil etish",
        "goal": "qisqa vebinarni rejalashtirish va oʻtkazishni sinab koʻrish.",
        "info": "Onlayn diqqat tez pasayadi, shuning uchun leksiyani 10–15 daqiqalik bloklarga boʻlib, oraliqda interaktiv faollik (soʻrovnoma, savol, chat) berish tavsiya etiladi. Vebinar oldidan texnik tekshiruv qilinadi: ovoz, ekran namoyishi, havola. Ishtirok qoidalari eʼlon qilinadi (mikrofon, chat, savol berish tartibi). Yozuv va materiallar keyin ulashiladi.",
        "steps": [
            {
                "text": "Juftlikka boʻlining. Har juftlik oʻzi tanlagan mavzuda 5 daqiqalik mini-vebinar rejasini tuzadi: kirish → asosiy qism → savol/soʻrovnoma → xulosa.",
                "evidence": "none"
            },
            {
                "text": "Google Meet'da uchrashuv yarating va havolani juftingizga yuboring.",
                "evidence": "none"
            },
            {
                "text": "Texnik tekshiruv: ekran namoyishi, ovoz, kamera.",
                "evidence": "none"
            },
            {
                "text": "5 daqiqalik mini-vebinarni oʻtkazing. Oʻrtada bitta savol berib, chatda javob oling.",
                "evidence": "screenshot"
            },
            {
                "text": "Rollarni almashtiring: juftingiz oʻz vebinarini oʻtkazadi.",
                "evidence": "none"
            },
            {
                "text": "Juftingizga 2 ta yutuq va 1 ta tavsiya yozing.",
                "evidence": "none"
            }
        ],
        "test": [
            {
                "q": "Onlayn leksiya bloklarining tavsiya etilgan uzunligi?",
                "options": [
                    "10–15 daqiqa",
                    "45 daqiqa",
                    "90 daqiqa",
                    "2–3 daqiqa"
                ],
                "answer": 0
            },
            {
                "q": "Vebinar oldidan nima qilinadi?",
                "options": [
                    "Texnik tekshiruv",
                    "Hech narsa",
                    "Kamera oʻchiriladi",
                    "Chat yopiladi"
                ],
                "answer": 0
            },
            {
                "q": "Diqqatni ushlab turishning eng oddiy usuli?",
                "options": [
                    "Uzoq slayd oʻqish",
                    "Oraliqda soʻrovnoma yoki savol",
                    "Ovozni pasaytirish",
                    "Ekranni oʻchirish"
                ],
                "answer": 1
            },
            {
                "q": "Vebinardan keyin talabalarga nima ulashiladi?",
                "options": [
                    "Yozuv va materiallar",
                    "Hech narsa",
                    "Faqat baho",
                    "Parol"
                ],
                "answer": 0
            }
        ]
    },
    {
        "code": "M14",
        "title": "Portfolio baholash: talabalar portfoliosini yaratish va baholash",
        "goal": "elektron portfolio yaratish va uni mezon asosida baholash.",
        "info": "Elektron portfolio — talaba ishlari va yutuqlarining tizimli toʻplami. Uning turlari: jarayon portfoliosi (oʻsishni koʻrsatadi), namoyish portfoliosi (eng yaxshi ishlar) va baholash portfoliosi (belgilangan mezonlar boʻyicha). Portfolioning muhim qismi — refleksiya: talaba nimani oʻrganganini oʻzi tahlil qiladi. Baholash rubrika (mezonlar jadvali) asosida olib boriladi.",
        "steps": [
            {
                "text": "Google Sites'da yangi sayt yarating: \"Ism Familiya — Portfolio\".",
                "evidence": "none"
            },
            {
                "text": "3 ta sahifa qoʻshing: \"Men haqimda\", \"Ishlarim\", \"Refleksiya\".",
                "evidence": "none"
            },
            {
                "text": "\"Ishlarim\" sahifasiga oldingi missiyalardagi ikki ishingizni qoʻshing (havola yoki skrinshot).",
                "evidence": "none"
            },
            {
                "text": "\"Refleksiya\" sahifasida 3 savolga javob yozing: nimani oʻrgandim? nima qiyin boʻldi? endi qanday qoʻllayman?",
                "evidence": "none"
            },
            {
                "text": "Saytni \"Publish\" qiling va havolani yuklang.",
                "evidence": "link"
            },
            {
                "text": "Kursdoshingiz portfoliosini rubrika boʻyicha baholang: tuzilma (0–3), mazmun (0–4), refleksiya (0–3).",
                "evidence": "none"
            }
        ],
        "test": [
            {
                "q": "Talabaning oʻsishini koʻrsatadigan portfolio turi?",
                "options": [
                    "Jarayon portfoliosi",
                    "Namoyish portfoliosi",
                    "Reklama portfoliosi",
                    "Shaxsiy hujjat"
                ],
                "answer": 0
            },
            {
                "q": "Portfolioning majburiy muhim qismi?",
                "options": [
                    "Refleksiya",
                    "Reklama",
                    "Musiqa",
                    "Parol"
                ],
                "answer": 0
            },
            {
                "q": "Portfolio qanday baholanadi?",
                "options": [
                    "Rubrika boʻyicha",
                    "Tasodifiy",
                    "Hajmi boʻyicha",
                    "Dizayn rangi boʻyicha"
                ],
                "answer": 0
            },
            {
                "q": "Elektron portfolio yaratish uchun bepul vosita?",
                "options": [
                    "Google Sites",
                    "Photoshop",
                    "AutoCAD",
                    "MATLAB"
                ],
                "answer": 0
            }
        ]
    },
    {
        "code": "M19",
        "title": "Talabalar motivatsiyasini oshirish strategiyalari",
        "goal": "motivatsiya modellarini masofaviy kursga qoʻllash.",
        "info": "J. Keller'ning ARCS modeli motivatsiyani toʻrt shartga ajratadi: diqqat (Attention), dolzarblik (Relevance), ishonch (Confidence) va qoniqish (Satisfaction). Deci va Ryan'ning oʻz-oʻzini belgilash nazariyasiga koʻra ichki motivatsiya uch ehtiyoj qondirilganda kuchayadi: avtonomiya (tanlov erkinligi), kompetentlik (uddalay olish hissi) va bogʻliqlik (hamjamiyat bilan aloqa). Masofaviy taʼlimda motivatsiyani oshirish usullari: tezkor qayta aloqa, kichik bosqichli maqsadlar, progress koʻrsatkichi va guruh ishi.",
        "steps": [
            {
                "text": "Vaziyat: \"Onlayn kursda 2-haftadan keyin talabalarning 40 foizi faolligini yoʻqotdi.\" Guruhlarga boʻlining.",
                "evidence": "none"
            },
            {
                "text": "Mumkin boʻlgan 3 ta sababni yozing.",
                "evidence": "none"
            },
            {
                "text": "ARCS modelining har bir harfi uchun bittadan aniq yechim yozing (jami 4 ta).",
                "evidence": "none"
            },
            {
                "text": "Bitta yechimni Google Classroom yoki Zukkoo'da qanday amalga oshirishni koʻrsating, masalan eʼlon, progress jadvali yoki mini-test.",
                "evidence": "screenshot"
            },
            {
                "text": "Guruhlar yechimlarni taqdim etadi va eng yaxshisiga ovoz beradi.",
                "evidence": "none"
            }
        ],
        "test": [
            {
                "q": "ARCS modelidagi \"R\" nimani bildiradi?",
                "options": [
                    "Dolzarblik (Relevance)",
                    "Natija (Result)",
                    "Qoida (Rule)",
                    "Reyting (Rating)"
                ],
                "answer": 0
            },
            {
                "q": "Oʻz-oʻzini belgilash nazariyasining uch ehtiyoji?",
                "options": [
                    "Avtonomiya, kompetentlik, bogʻliqlik",
                    "Ovqat, uyqu, dam",
                    "Baho, diplom, ish",
                    "Test, imtihon, kurs"
                ],
                "answer": 0
            },
            {
                "q": "ARCS modelining muallifi?",
                "options": [
                    "J. Keller",
                    "A. Maslou",
                    "B. Blum",
                    "J. Moreno"
                ],
                "answer": 0
            },
            {
                "q": "Masofaviy taʼlimda motivatsiyani tez oshiradigan usul?",
                "options": [
                    "Tezkor qayta aloqa",
                    "Javobsiz qoldirish",
                    "Uzoq muddat",
                    "Faqat yakuniy imtihon"
                ],
                "answer": 0
            }
        ]
    },
    {
        "code": "A2",
        "title": "Google Classroom bilan ishlash",
        "goal": "kurs yaratish, material yuklash, topshiriq berish va baholash.",
        "steps": [
            {
                "text": "classroom.google.com ga kiring → \"+\" → \"Sinf yaratish\" (nomi: \"Ism — Test sinf\").",
                "evidence": "none"
            },
            {
                "text": "Sinf kodini juftingizga bering va uning sinfiga talaba sifatida qoʻshiling.",
                "evidence": "none"
            },
            {
                "text": "\"Topshiriqlar\" boʻlimida \"Mavzu\" yarating, unga bitta material yuklang (PDF yoki havola).",
                "evidence": "none"
            },
            {
                "text": "Topshiriq yarating: muddat, 10 ball va oddiy rubrika (2 mezon).",
                "evidence": "screenshot"
            },
            {
                "text": "Juftingiz sinfidagi topshiriqni bajarib, fayl biriktirib topshiring.",
                "evidence": "none"
            },
            {
                "text": "Oʻz sinfingizda juftingiz ishini baholang, izoh yozing va \"Qaytarish\"ni bosing.",
                "evidence": "screenshot"
            }
        ],
        "test": [
            {
                "q": "Talaba sinfga qanday qoʻshiladi?",
                "options": [
                    "Sinf kodi orqali",
                    "Telefon raqami orqali",
                    "Faqat administrator qoʻshadi",
                    "Qoʻshilib boʻlmaydi"
                ],
                "answer": 0
            },
            {
                "q": "Topshiriqlar qaysi boʻlimda yaratiladi?",
                "options": [
                    "Lenta",
                    "Topshiriqlar (Classwork)",
                    "Odamlar",
                    "Baholar"
                ],
                "answer": 1
            },
            {
                "q": "Baholangan ishni talabaga koʻrsatish uchun nima bosiladi?",
                "options": [
                    "Qaytarish (Return)",
                    "Oʻchirish",
                    "Arxivlash",
                    "Nusxa olish"
                ],
                "answer": 0
            },
            {
                "q": "Rubrika nima uchun kerak?",
                "options": [
                    "Baholash mezonlarini aniq koʻrsatish uchun",
                    "Dizayn uchun",
                    "Parol uchun",
                    "Video uchun"
                ],
                "answer": 0
            }
        ]
    },
    {
        "code": "A5",
        "title": "Microsoft Teams orqali jamoaviy ishlash",
        "goal": "jamoa, kanal, chat va fayl bilan birgalikda ishlashni oʻrganish.",
        "steps": [
            {
                "text": "Universitet Microsoft 365 akkauntingiz bilan teams.microsoft.com ga kiring.",
                "evidence": "none"
            },
            {
                "text": "Oʻqituvchi bergan kod bilan dars jamoasiga qoʻshiling.",
                "evidence": "none"
            },
            {
                "text": "Guruhingiz uchun kanal yarating (nomi: \"Guruh-1\" va hokazo).",
                "evidence": "none"
            },
            {
                "text": "Kanalda xabar yozib, kursdoshingizni @eslatma bilan belgilang.",
                "evidence": "none"
            },
            {
                "text": "\"Fayllar\" boʻlimida Word hujjat yarating va guruh bilan birga 3 qatordan yozing: har kim oʻz qatorini.",
                "evidence": "screenshot"
            },
            {
                "text": "Kanalda 10 daqiqalik \"Uchrashuv\" rejalashtiring va uni boshlab, 1 daqiqa sinab koʻring.",
                "evidence": "none"
            }
        ],
        "test": [
            {
                "q": "Teams'da jamoa ichidagi mavzuli boʻlim nima deyiladi?",
                "options": [
                    "Kanal",
                    "Papka",
                    "Sinf",
                    "Lenta"
                ],
                "answer": 0
            },
            {
                "q": "Kursdoshni xabarda belgilash belgisi?",
                "options": [
                    "@",
                    "#",
                    "$",
                    "&"
                ],
                "answer": 0
            },
            {
                "q": "Teams'da hujjatni birgalikda tahrirlash qayerda?",
                "options": [
                    "Fayllar boʻlimi",
                    "Kalendar",
                    "Sozlamalar",
                    "Profil"
                ],
                "answer": 0
            },
            {
                "q": "Kanal ichida onlayn dars qanday boshlanadi?",
                "options": [
                    "Uchrashuv (Meet)",
                    "Email",
                    "SMS",
                    "Faks"
                ],
                "answer": 0
            }
        ]
    },
    {
        "code": "A12",
        "title": "Khan Academy orqali oʻz-oʻzini oʻqitish",
        "goal": "MOOC/ochiq platformada mustaqil oʻqish va oʻz progressini kuzatish.",
        "info": "Khan Academy — bepul taʼlim platformasi. Unda video darslar va mashqlar bor. Har bir koʻnikma boʻyicha oʻzlashtirish darajasi koʻrsatiladi: urinilgan → tanish → mohir → toʻliq oʻzlashtirilgan (Attempted → Familiar → Proficient → Mastered).",
        "steps": [
            {
                "text": "khanacademy.org ga Google akkaunt bilan roʻyxatdan oʻting. Agar oʻzbek tili mavjud boʻlsa, uni tanlang.",
                "evidence": "none"
            },
            {
                "text": "\"Sinfga qoʻshilish\" orqali oʻqituvchi kodini kiriting.",
                "evidence": "none"
            },
            {
                "text": "Oʻqituvchi tanlagan boʻlimdagi bitta video darsni koʻring.",
                "evidence": "none"
            },
            {
                "text": "Shu koʻnikma boʻyicha mashqni bajaring va kamida \"tanish\" darajasiga yeting.",
                "evidence": "screenshot"
            },
            {
                "text": "Profilingizdagi progress sahifasini oching: qaysi koʻnikmalar qaysi darajada?",
                "evidence": "none"
            },
            {
                "text": "3 jumlalik refleksiya: bunday platforma sirtqi talabaga qanday yordam beradi?",
                "evidence": "none"
            }
        ],
        "test": [
            {
                "q": "Khan Academy'da eng yuqori oʻzlashtirish darajasi?",
                "options": [
                    "Mastered (toʻliq oʻzlashtirilgan)",
                    "Familiar (tanish)",
                    "Attempted (urinilgan)",
                    "Started (boshlangan)"
                ],
                "answer": 0
            },
            {
                "q": "Khan Academy pullimi?",
                "options": [
                    "Bepul",
                    "Faqat pullik",
                    "Faqat universitetlar uchun",
                    "Faqat AQShda"
                ],
                "answer": 0
            },
            {
                "q": "Talaba oʻqituvchi sinfiga qanday qoʻshiladi?",
                "options": [
                    "Sinf kodi orqali",
                    "Pasport orqali",
                    "Telefon orqali",
                    "Qoʻshilmaydi"
                ],
                "answer": 0
            },
            {
                "q": "Mustaqil taʼlimda oʻz progressini kuzatish nima beradi?",
                "options": [
                    "Oʻz-oʻzini nazorat va motivatsiya",
                    "Hech narsa",
                    "Faqat baho",
                    "Reklama"
                ],
                "answer": 0
            }
        ]
    }
];

export const missionByCode = (code: string) => MISSIONS.find(m => m.code === code);
