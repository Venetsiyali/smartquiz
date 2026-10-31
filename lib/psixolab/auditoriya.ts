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

export const AUD_TOPICS: AudTopic[] = [
    {
        "id": "L3",
        "kind": "lecture",
        "title": {
            "uz": "Oʻqitish metodikasi va ilgʻor pedagogik texnologiyalar",
            "ru": "Методика обучения и передовые педагогические технологии"
        },
        "explain": {
            "uz": [
                {
                    "p": "Oʻqitish metodi — oʻqituvchi va talabaning taʼlim maqsadiga erishish uchun birgalikdagi faoliyat usuli. Anʼanaviy tasnif boʻyicha metodlar ogʻzaki (maʼruza, hikoya, suhbat), koʻrgazmali (namoyish, illyustratsiya) va amaliy (mashq, laboratoriya ishi) turlarga boʻlinadi."
                },
                {
                    "p": "Pedagogik texnologiya — taʼlim jarayonini oldindan loyihalash va kafolatlangan natijaga olib chiqish tizimi. Uning belgilari: aniq maqsad, bosqichlilik, natijani oʻlchash va takrorlanuvchanlik."
                },
                {
                    "p": "Interaktiv metodlar talabani faol ishtirokchiga aylantiradi: \"Aqliy hujum\" (Brainstorming, A. Osborn), \"Keys-stadi\" (Garvard biznes maktabi), \"Klaster\", \"Insert\", \"Venn diagrammasi\", \"Zigzag\" (Jigsaw, E. Aronson). Zamonaviy modellar: aralash taʼlim (blended learning) va \"agʻdarilgan sinf\" (flipped classroom). Maqsadlarni darajalash uchun Blum taksonomiyasi qoʻllanadi: eslash → tushunish → qoʻllash → tahlil → baholash → yaratish."
                }
            ],
            "ru": [
                {
                    "p": "Метод обучения — способ совместной деятельности преподавателя и студента для достижения учебной цели. По традиционной классификации методы делятся на словесные (лекция, рассказ, беседа), наглядные (демонстрация, иллюстрация) и практические (упражнение, лабораторная работа)."
                },
                {
                    "p": "Педагогическая технология — система предварительного проектирования учебного процесса с гарантированным результатом. Её признаки: чёткая цель, поэтапность, измеримость результата, воспроизводимость."
                },
                {
                    "p": "Интерактивные методы делают студента активным участником: «Мозговой штурм» (А. Осборн), «Кейс-стади» (Гарвардская школа бизнеса), «Кластер», «Инсерт», «Диаграмма Венна», «Зигзаг» (Jigsaw, Э. Аронсон). Современные модели: смешанное обучение (blended learning) и «перевёрнутый класс» (flipped classroom). Для уровней целей используется таксономия Блума: запоминание → понимание → применение → анализ → оценка → создание."
                }
            ]
        },
        "concepts": {
            "uz": [
                "metod",
                "usul",
                "vosita",
                "pedagogik texnologiya",
                "interaktiv metod",
                "Blum taksonomiyasi"
            ],
            "ru": [
                "метод",
                "приём",
                "средство",
                "педагогическая технология",
                "интерактивный метод",
                "таксономия Блума"
            ]
        },
        "tests": [
            {
                "q": {
                    "uz": "\"Aqliy hujum\" metodining muallifi kim?",
                    "ru": "Автор метода «мозговой штурм»?"
                },
                "options": [
                    {
                        "uz": "A. Osborn",
                        "ru": "А. Осборн"
                    },
                    {
                        "uz": "E. Aronson",
                        "ru": "Э. Аронсон"
                    },
                    {
                        "uz": "B. Blum",
                        "ru": "Б. Блум"
                    },
                    {
                        "uz": "Ya. A. Komenskiy",
                        "ru": "Я. А. Коменский"
                    }
                ],
                "answer": 0
            },
            {
                "q": {
                    "uz": "Blum taksonomiyasining eng yuqori darajasi?",
                    "ru": "Высший уровень таксономии Блума?"
                },
                "options": [
                    {
                        "uz": "Tahlil",
                        "ru": "Анализ"
                    },
                    {
                        "uz": "Baholash",
                        "ru": "Оценка"
                    },
                    {
                        "uz": "Yaratish",
                        "ru": "Создание"
                    },
                    {
                        "uz": "Qoʻllash",
                        "ru": "Применение"
                    }
                ],
                "answer": 2
            },
            {
                "q": {
                    "uz": "Talaba nazariyani uyda oʻrganib, darsda amaliy ish qiladigan model?",
                    "ru": "Модель, где теорию изучают дома, а на занятии выполняют практику?"
                },
                "options": [
                    {
                        "uz": "Aralash taʼlim",
                        "ru": "Смешанное обучение"
                    },
                    {
                        "uz": "Agʻdarilgan sinf",
                        "ru": "Перевёрнутый класс"
                    },
                    {
                        "uz": "Masofaviy taʼlim",
                        "ru": "Дистанционное обучение"
                    },
                    {
                        "uz": "Keys-stadi",
                        "ru": "Кейс-стади"
                    }
                ],
                "answer": 1
            },
            {
                "q": {
                    "uz": "Quyidagilardan qaysi biri ogʻzaki metod?",
                    "ru": "Какой из методов словесный?"
                },
                "options": [
                    {
                        "uz": "Namoyish",
                        "ru": "Демонстрация"
                    },
                    {
                        "uz": "Laboratoriya ishi",
                        "ru": "Лабораторная работа"
                    },
                    {
                        "uz": "Suhbat",
                        "ru": "Беседа"
                    },
                    {
                        "uz": "Mashq",
                        "ru": "Упражнение"
                    }
                ],
                "answer": 2
            },
            {
                "q": {
                    "uz": "Pedagogik texnologiyaning asosiy belgisi?",
                    "ru": "Главный признак педтехнологии?"
                },
                "options": [
                    {
                        "uz": "Improvizatsiya",
                        "ru": "Импровизация"
                    },
                    {
                        "uz": "Kafolatlangan natija",
                        "ru": "Гарантированный результат"
                    },
                    {
                        "uz": "Faqat kompyuter",
                        "ru": "Только компьютер"
                    },
                    {
                        "uz": "Faqat maʼruza",
                        "ru": "Только лекция"
                    }
                ],
                "answer": 1
            }
        ],
        "pairs": [
            {
                "left": {
                    "uz": "Zigzag",
                    "ru": "Зигзаг"
                },
                "right": {
                    "uz": "Har kim matnning bir qismini oʻrganib, guruhga tushuntiradi",
                    "ru": "Каждый изучает часть текста и объясняет группе"
                }
            },
            {
                "left": {
                    "uz": "Klaster",
                    "ru": "Кластер"
                },
                "right": {
                    "uz": "Tushunchalarni markaziy soʻz atrofida bogʻlash",
                    "ru": "Связывание понятий вокруг центрального слова"
                }
            },
            {
                "left": {
                    "uz": "Insert",
                    "ru": "Инсерт"
                },
                "right": {
                    "uz": "Matnni belgilar (✓, +, −, ?) bilan oʻqish",
                    "ru": "Чтение текста с пометками (✓, +, −, ?)"
                }
            },
            {
                "left": {
                    "uz": "Venn diagrammasi",
                    "ru": "Диаграмма Венна"
                },
                "right": {
                    "uz": "Ikki tushunchaning oʻxshash va farqli tomonlari",
                    "ru": "Сходства и различия двух понятий"
                }
            },
            {
                "left": {
                    "uz": "Keys-stadi",
                    "ru": "Кейс-стади"
                },
                "right": {
                    "uz": "Real vaziyatni tahlil qilib yechim topish",
                    "ru": "Анализ реальной ситуации и поиск решения"
                }
            }
        ],
        "caseTask": {
            "uz": "Siz IT kollej oʻqituvchisisiz. 30 talabali guruhda \"Kompyuter tarmoqlari\" mavzusini 80 daqiqada oʻtishingiz kerak. Talabalarning yarmi mavzuni biladi, yarmi umuman bilmaydi. Qaysi 2 ta interaktiv metodni tanlaysiz va nima uchun? Dars bosqichlarini vaqti bilan yozing (8–10 jumla).",
            "ru": "Вы преподаватель IT-колледжа. В группе из 30 студентов нужно за 80 минут пройти тему «Компьютерные сети». Половина группы знает тему, половина — нет. Какие 2 интерактивных метода вы выберете и почему? Опишите этапы занятия с указанием времени (8–10 предложений)."
        }
    },
    {
        "id": "L6",
        "kind": "lecture",
        "title": {
            "uz": "Bilish jarayonlari. Faoliyat. Motiv va motivatsiya",
            "ru": "Когнитивные процессы. Деятельность. Мотив и мотивация"
        },
        "explain": {
            "uz": [
                {
                    "p": "Bilish jarayonlari — inson olamni aks ettiradigan psixik jarayonlar: sezgi, idrok, diqqat, xotira, tafakkur, xayol va nutq. Sezgi buyumning alohida xususiyatini (rang, tovush), idrok esa buyumni yaxlit aks ettiradi. Qisqa muddatli xotira hajmi oʻrtacha 7±2 birlik (J. Miller). Ebbingauz unutish egri chizigʻi materialning katta qismi dastlabki soatlarda unutilishini koʻrsatadi."
                },
                {
                    "p": "Faoliyat — ongli maqsadga yoʻnaltirilgan faollik. Asosiy turlari: oʻyin, oʻqish va mehnat. Faoliyat nazariyasini A. N. Leontev ishlab chiqqan."
                },
                {
                    "p": "Motiv — faoliyatga undovchi sabab; motivatsiya — motivlar tizimi. Ichki motivatsiya ishning oʻziga qiziqishdan, tashqi motivatsiya mukofot yoki jazodan kelib chiqadi. A. Maslou ehtiyojlar ierarxiyasi: fiziologik → xavfsizlik → mansublik va muhabbat → hurmat → oʻzini namoyon qilish. Yerks–Dodson qonuniga koʻra, eng yuqori natijaga oʻrtacha motivatsiyada erishiladi. Ongsiz motivlarni Z. Freyd oʻrgangan: inson ayrim harakatlarining sababini anglamasligi mumkin."
                }
            ],
            "ru": [
                {
                    "p": "Когнитивные процессы — психические процессы отражения мира: ощущение, восприятие, внимание, память, мышление, воображение, речь. Ощущение отражает отдельное свойство предмета (цвет, звук), восприятие — предмет целиком. Объём кратковременной памяти в среднем 7±2 единицы (Дж. Миллер). Кривая забывания Эббингауза показывает, что большая часть материала забывается в первые часы."
                },
                {
                    "p": "Деятельность — активность, направленная на сознательную цель. Основные виды: игра, учение, труд. Теорию деятельности разработал А. Н. Леонтьев."
                },
                {
                    "p": "Мотив — побудительная причина деятельности; мотивация — система мотивов. Внутренняя мотивация исходит из интереса к самой деятельности, внешняя — из награды или наказания. Иерархия потребностей А. Маслоу: физиологические → безопасность → принадлежность и любовь → уважение → самоактуализация. По закону Йеркса–Додсона наилучший результат достигается при средней мотивации. Бессознательные мотивы изучал З. Фрейд: человек может не осознавать причины некоторых своих действий."
                }
            ]
        },
        "concepts": {
            "uz": [
                "sezgi",
                "idrok",
                "diqqat",
                "xotira",
                "tafakkur",
                "faoliyat",
                "motiv",
                "ichki/tashqi motivatsiya"
            ],
            "ru": [
                "ощущение",
                "восприятие",
                "внимание",
                "память",
                "мышление",
                "деятельность",
                "мотив",
                "внутренняя/внешняя мотивация"
            ]
        },
        "tests": [
            {
                "q": {
                    "uz": "Qisqa muddatli xotiraning oʻrtacha hajmi?",
                    "ru": "Средний объём кратковременной памяти?"
                },
                "options": [
                    {
                        "uz": "3±1",
                        "ru": "3±1"
                    },
                    {
                        "uz": "7±2",
                        "ru": "7±2"
                    },
                    {
                        "uz": "12±3",
                        "ru": "12±3"
                    },
                    {
                        "uz": "Cheksiz",
                        "ru": "Безграничен"
                    }
                ],
                "answer": 1
            },
            {
                "q": {
                    "uz": "Maslou piramidasining eng yuqori pogʻonasi?",
                    "ru": "Высшая ступень пирамиды Маслоу?"
                },
                "options": [
                    {
                        "uz": "Xavfsizlik",
                        "ru": "Безопасность"
                    },
                    {
                        "uz": "Hurmat",
                        "ru": "Уважение"
                    },
                    {
                        "uz": "Oʻzini namoyon qilish",
                        "ru": "Самоактуализация"
                    },
                    {
                        "uz": "Mansublik",
                        "ru": "Принадлежность"
                    }
                ],
                "answer": 2
            },
            {
                "q": {
                    "uz": "Talaba dasturlashni qiziqqani uchun oʻrganadi. Bu qanday motivatsiya?",
                    "ru": "Студент изучает программирование из интереса. Это какая мотивация?"
                },
                "options": [
                    {
                        "uz": "Tashqi",
                        "ru": "Внешняя"
                    },
                    {
                        "uz": "Ichki",
                        "ru": "Внутренняя"
                    },
                    {
                        "uz": "Salbiy",
                        "ru": "Отрицательная"
                    },
                    {
                        "uz": "Ongsiz",
                        "ru": "Бессознательная"
                    }
                ],
                "answer": 1
            },
            {
                "q": {
                    "uz": "Buyumni yaxlit aks ettiruvchi jarayon?",
                    "ru": "Процесс целостного отражения предмета?"
                },
                "options": [
                    {
                        "uz": "Sezgi",
                        "ru": "Ощущение"
                    },
                    {
                        "uz": "Idrok",
                        "ru": "Восприятие"
                    },
                    {
                        "uz": "Xayol",
                        "ru": "Воображение"
                    },
                    {
                        "uz": "Nutq",
                        "ru": "Речь"
                    }
                ],
                "answer": 1
            },
            {
                "q": {
                    "uz": "Yerks–Dodson qonuniga koʻra eng yaxshi natija qachon boʻladi?",
                    "ru": "По закону Йеркса–Додсона лучший результат достигается при…"
                },
                "options": [
                    {
                        "uz": "Juda past motivatsiyada",
                        "ru": "Очень низкой мотивации"
                    },
                    {
                        "uz": "Oʻrtacha motivatsiyada",
                        "ru": "Средней мотивации"
                    },
                    {
                        "uz": "Juda yuqori motivatsiyada",
                        "ru": "Очень высокой мотивации"
                    },
                    {
                        "uz": "Motivatsiyasiz",
                        "ru": "Без мотивации"
                    }
                ],
                "answer": 1
            }
        ],
        "pairs": [
            {
                "left": {
                    "uz": "A. N. Leontev",
                    "ru": "А. Н. Леонтьев"
                },
                "right": {
                    "uz": "Faoliyat nazariyasi",
                    "ru": "Теория деятельности"
                }
            },
            {
                "left": {
                    "uz": "A. Maslou",
                    "ru": "А. Маслоу"
                },
                "right": {
                    "uz": "Ehtiyojlar ierarxiyasi",
                    "ru": "Иерархия потребностей"
                }
            },
            {
                "left": {
                    "uz": "G. Ebbingauz",
                    "ru": "Г. Эббингауз"
                },
                "right": {
                    "uz": "Unutish egri chizigʻi",
                    "ru": "Кривая забывания"
                }
            },
            {
                "left": {
                    "uz": "J. Miller",
                    "ru": "Дж. Миллер"
                },
                "right": {
                    "uz": "Xotira hajmi 7±2",
                    "ru": "Объём памяти 7±2"
                }
            },
            {
                "left": {
                    "uz": "Z. Freyd",
                    "ru": "З. Фрейд"
                },
                "right": {
                    "uz": "Ongsiz motivlar",
                    "ru": "Бессознательные мотивы"
                }
            }
        ],
        "caseTask": {
            "uz": "Talaba Aziz semestr boshida aʼlo oʻqidi, lekin hozir darslarga kelmayapti. Uning aytishicha, \"baho baribir hech narsani hal qilmaydi\", u esa kechasi frilans buyurtmalar bajaryapti. Azizning motivatsiyasini Maslou piramidasi va ichki/tashqi motivatsiya nuqtayi nazaridan tahlil qiling. Oʻqituvchi sifatida qanday 3 ta qadam qoʻyasiz?",
            "ru": "Студент Азиз в начале семестра учился отлично, но сейчас не ходит на занятия. По его словам, «оценка всё равно ничего не решает», а ночью он выполняет фриланс-заказы. Проанализируйте мотивацию Азиза с точки зрения пирамиды Маслоу и внутренней/внешней мотивации. Какие 3 шага вы предпримете как преподаватель?"
        }
    },
    {
        "id": "L7",
        "kind": "lecture",
        "title": {
            "uz": "Shaxsning individual-psixologik xususiyatlari. Muloqot",
            "ru": "Индивидуально-психологические особенности личности. Общение"
        },
        "explain": {
            "uz": [
                {
                    "p": "Temperament — psixik faoliyatning dinamik tomoni: tezlik, kuch, muvozanat. U tugʻma boʻlib, nerv sistemasi tipiga bogʻliq. Tasnif Gippokrat va Galenga borib taqaladi, I. P. Pavlov esa uni nerv sistemasi xususiyatlari bilan bogʻlagan:"
                },
                {
                    "ul": [
                        "sangvinik — kuchli, muvozanatli, harakatchan;",
                        "xolerik — kuchli, muvozanatsiz;",
                        "flegmatik — kuchli, muvozanatli, sust (inert);",
                        "melanxolik — kuchsiz nerv tizimi."
                    ]
                },
                {
                    "p": "Xarakter — shaxsning hayot davomida orttirilgan barqaror xislatlari majmui (masalan, mehnatsevarlik, halollik). Temperament tugʻma, xarakter esa tarbiya va muhitda shakllanadi."
                },
                {
                    "p": "Qobiliyat — faoliyatni muvaffaqiyatli bajarish imkonini beruvchi xususiyat. Uning tugʻma asosi layoqat deb ataladi. Qobiliyatlar umumiy va maxsus (masalan, matematik, musiqiy) turlarga boʻlinadi; yuqori darajalari isteʼdod va daho."
                },
                {
                    "p": "Muloqot verbal (soʻz orqali) va noverbal (mimika, imo-ishora, intonatsiya) boʻladi. G. M. Andreyeva muloqotning uch tomonini ajratgan: kommunikativ (axborot almashish), interaktiv (oʻzaro taʼsir) va pertseptiv (bir-birini idrok etish)."
                }
            ],
            "ru": [
                {
                    "p": "Темперамент — динамическая сторона психической деятельности: скорость, сила, уравновешенность. Он врождённый и зависит от типа нервной системы. Классификация восходит к Гиппократу и Галену, а И. П. Павлов связал её со свойствами нервной системы:"
                },
                {
                    "ul": [
                        "сангвиник — сильный, уравновешенный, подвижный;",
                        "холерик — сильный, неуравновешенный;",
                        "флегматик — сильный, уравновешенный, инертный;",
                        "меланхолик — слабый тип нервной системы."
                    ]
                },
                {
                    "p": "Характер — совокупность устойчивых черт, приобретённых в течение жизни (например, трудолюбие, честность). Темперамент врождён, характер формируется воспитанием и средой."
                },
                {
                    "p": "Способности — свойства, обеспечивающие успешное выполнение деятельности. Их врождённая основа называется задатками. Способности бывают общие и специальные (например, математические, музыкальные); высшие уровни — талант и гениальность."
                },
                {
                    "p": "Общение бывает вербальным (словесным) и невербальным (мимика, жесты, интонация). Г. М. Андреева выделила три стороны общения: коммуникативную (обмен информацией), интерактивную (взаимодействие) и перцептивную (восприятие друг друга)."
                }
            ]
        },
        "concepts": {
            "uz": [
                "temperament",
                "xarakter",
                "qobiliyat",
                "layoqat",
                "isteʼdod",
                "verbal va noverbal muloqot"
            ],
            "ru": [
                "темперамент",
                "характер",
                "способности",
                "задатки",
                "талант",
                "вербальное и невербальное общение"
            ]
        },
        "tests": [
            {
                "q": {
                    "uz": "Kuchli, muvozanatli, sust nerv tizimi qaysi temperamentga mos?",
                    "ru": "Сильный, уравновешенный, инертный тип — это…"
                },
                "options": [
                    {
                        "uz": "Sangvinik",
                        "ru": "Сангвиник"
                    },
                    {
                        "uz": "Xolerik",
                        "ru": "Холерик"
                    },
                    {
                        "uz": "Flegmatik",
                        "ru": "Флегматик"
                    },
                    {
                        "uz": "Melanxolik",
                        "ru": "Меланхолик"
                    }
                ],
                "answer": 2
            },
            {
                "q": {
                    "uz": "Qobiliyatning tugʻma asosi?",
                    "ru": "Врождённая основа способностей?"
                },
                "options": [
                    {
                        "uz": "Layoqat",
                        "ru": "Задатки"
                    },
                    {
                        "uz": "Xarakter",
                        "ru": "Характер"
                    },
                    {
                        "uz": "Isteʼdod",
                        "ru": "Талант"
                    },
                    {
                        "uz": "Malaka",
                        "ru": "Навык"
                    }
                ],
                "answer": 0
            },
            {
                "q": {
                    "uz": "Hayot davomida orttiriladigan xususiyat?",
                    "ru": "Что приобретается в течение жизни?"
                },
                "options": [
                    {
                        "uz": "Temperament",
                        "ru": "Темперамент"
                    },
                    {
                        "uz": "Xarakter",
                        "ru": "Характер"
                    },
                    {
                        "uz": "Nerv tizimi tipi",
                        "ru": "Тип нервной системы"
                    },
                    {
                        "uz": "Layoqat",
                        "ru": "Задатки"
                    }
                ],
                "answer": 1
            },
            {
                "q": {
                    "uz": "Muloqotning bir-birini idrok etish tomoni?",
                    "ru": "Сторона общения, связанная с восприятием друг друга?"
                },
                "options": [
                    {
                        "uz": "Kommunikativ",
                        "ru": "Коммуникативная"
                    },
                    {
                        "uz": "Interaktiv",
                        "ru": "Интерактивная"
                    },
                    {
                        "uz": "Pertseptiv",
                        "ru": "Перцептивная"
                    },
                    {
                        "uz": "Verbal",
                        "ru": "Вербальная"
                    }
                ],
                "answer": 2
            },
            {
                "q": {
                    "uz": "Temperamentni nerv tizimi xususiyatlari bilan bogʻlagan olim?",
                    "ru": "Учёный, связавший темперамент со свойствами нервной системы?"
                },
                "options": [
                    {
                        "uz": "I. P. Pavlov",
                        "ru": "И. П. Павлов"
                    },
                    {
                        "uz": "Z. Freyd",
                        "ru": "З. Фрейд"
                    },
                    {
                        "uz": "A. Maslou",
                        "ru": "А. Маслоу"
                    },
                    {
                        "uz": "L. S. Vygotskiy",
                        "ru": "Л. С. Выготский"
                    }
                ],
                "answer": 0
            }
        ],
        "pairs": [
            {
                "left": {
                    "uz": "Sangvinik",
                    "ru": "Сангвиник"
                },
                "right": {
                    "uz": "Tez moslashadi, xushchaqchaq, qiziqishi tez almashadi",
                    "ru": "Быстро адаптируется, жизнерадостен, интересы быстро меняются"
                }
            },
            {
                "left": {
                    "uz": "Xolerik",
                    "ru": "Холерик"
                },
                "right": {
                    "uz": "Gʻayratli, tez qizishadi, kayfiyati keskin oʻzgaradi",
                    "ru": "Энергичен, вспыльчив, резкие перепады настроения"
                }
            },
            {
                "left": {
                    "uz": "Flegmatik",
                    "ru": "Флегматик"
                },
                "right": {
                    "uz": "Xotirjam, sekin, ishni oxiriga yetkazadi",
                    "ru": "Спокоен, нетороплив, доводит дело до конца"
                }
            },
            {
                "left": {
                    "uz": "Melanxolik",
                    "ru": "Меланхолик"
                },
                "right": {
                    "uz": "Taʼsirchan, tez charchaydi, chuqur his qiladi",
                    "ru": "Впечатлителен, быстро устаёт, глубоко переживает"
                }
            },
            {
                "left": {
                    "uz": "Noverbal muloqot",
                    "ru": "Невербальное общение"
                },
                "right": {
                    "uz": "Mimika, imo-ishora, intonatsiya",
                    "ru": "Мимика, жесты, интонация"
                }
            }
        ],
        "caseTask": {
            "uz": "IT-kompaniyada 4 kishilik jamoa tuzilmoqda: tezkor \"hotfix\"larni tuzatish, uzoq hujjatlashtirish, mijoz bilan muloqot va dizayn tafsilotlarini tekshirish. Jamoada sangvinik, xolerik, flegmatik va melanxolik bor. Vazifalarni kimga berasiz? Har bir tanlovni temperament xususiyati bilan asoslang. Nega temperament \"yaxshi\" yoki \"yomon\" boʻlmasligini tushuntiring.",
            "ru": "В IT-компании формируется команда из 4 человек: срочное исправление «хотфиксов», длительное документирование, общение с клиентом и проверка деталей дизайна. В команде сангвиник, холерик, флегматик и меланхолик. Кому какую задачу вы дадите? Обоснуйте каждый выбор свойствами темперамента. Объясните, почему темперамент не бывает «хорошим» или «плохим»."
        }
    },
    {
        "id": "P1",
        "kind": "practice",
        "title": {
            "uz": "Pedagogikaning paydo boʻlishi. Sharq mutafakkirlarining pedagogik gʻoyalari",
            "ru": "Возникновение педагогики. Педагогические идеи восточных мыслителей"
        },
        "explain": {
            "uz": [
                {
                    "p": "Tarbiya insoniyat bilan birga paydo boʻlgan: ibtidoiy jamiyatda tajriba kattalardan bolalarga mehnat va marosimlar orqali oʻtgan. \"Pedagogika\" soʻzi yunoncha \"paidagogos\" — \"bola yetaklovchi\" soʻzidan kelib chiqqan; Qadimgi Yunonistonda shunday deb bolani maktabga olib boradigan qulni atashgan."
                },
                {
                    "p": "Sharq mutafakkirlarining gʻoyalari:"
                },
                {
                    "ul": [
                        "Abu Nasr Forobiy — \"Fozil odamlar shahri\": baxtga bilim va axloq orqali erishiladi, tarbiya jamiyat vazifasi.",
                        "Abu Rayhon Beruniy — bilimni asta-sekin, zeriktirmasdan berish, mavzudan mavzuga oʻtib oʻqitish kerak.",
                        "Abu Ali ibn Sino — bolani guruhda (maktabda) oʻqitish, jismoniy va aqliy tarbiyani birga olib borishni tavsiya qilgan.",
                        "Yusuf Xos Hojib — \"Qutadgʻu bilig\" (1069): bilim va aql davlat va inson baxtining asosi.",
                        "Kaykovus — \"Qobusnoma\" (1082): farzand tarbiyasi, hunar oʻrganish va odob haqida nasihatlar.",
                        "Alisher Navoiy — \"Mahbub ul-qulub\": ustoz va muallimning jamiyatdagi roli, odob-axloq."
                    ]
                }
            ],
            "ru": [
                {
                    "p": "Воспитание возникло вместе с человечеством: в первобытном обществе опыт передавался от взрослых детям через труд и обряды. Слово «педагогика» происходит от греческого «paidagogos» — «детоводитель»; так в Древней Греции называли раба, сопровождавшего ребёнка в школу."
                },
                {
                    "p": "Идеи восточных мыслителей:"
                },
                {
                    "ul": [
                        "Абу Наср аль-Фараби — «Город добродетельных людей»: счастье достигается через знание и нравственность, воспитание — задача общества.",
                        "Абу Райхан Беруни — знания нужно давать постепенно, не утомляя, переходя от темы к теме.",
                        "Абу Али ибн Сина — рекомендовал обучать ребёнка в группе (в школе), сочетая физическое и умственное воспитание.",
                        "Юсуф Хас Хаджиб — «Кутадгу билиг» (1069): знание и разум — основа счастья человека и государства.",
                        "Кайкавус — «Кабус-наме» (1082): наставления о воспитании детей, ремесле и этикете.",
                        "Алишер Навои — «Махбуб ул-кулуб»: роль наставника и учителя в обществе, нравственность."
                    ]
                }
            ]
        },
        "concepts": {
            "uz": [
                "tarbiya",
                "paidagogos",
                "didaktika",
                "axloqiy tarbiya",
                "ustoz-shogird"
            ],
            "ru": [
                "воспитание",
                "paidagogos",
                "дидактика",
                "нравственное воспитание",
                "наставник и ученик"
            ]
        },
        "tests": [
            {
                "q": {
                    "uz": "\"Pedagogika\" soʻzining asl maʼnosi?",
                    "ru": "Исходное значение слова «педагогика»?"
                },
                "options": [
                    {
                        "uz": "Bola yetaklovchi",
                        "ru": "Детоводитель"
                    },
                    {
                        "uz": "Ilm sevuvchi",
                        "ru": "Любитель знаний"
                    },
                    {
                        "uz": "Ustoz",
                        "ru": "Учитель"
                    },
                    {
                        "uz": "Kitob",
                        "ru": "Книга"
                    }
                ],
                "answer": 0
            },
            {
                "q": {
                    "uz": "\"Fozil odamlar shahri\" muallifi?",
                    "ru": "Автор «Города добродетельных людей»?"
                },
                "options": [
                    {
                        "uz": "Beruniy",
                        "ru": "Беруни"
                    },
                    {
                        "uz": "Forobiy",
                        "ru": "Фараби"
                    },
                    {
                        "uz": "Ibn Sino",
                        "ru": "Ибн Сина"
                    },
                    {
                        "uz": "Navoiy",
                        "ru": "Навои"
                    }
                ],
                "answer": 1
            },
            {
                "q": {
                    "uz": "\"Qutadgʻu bilig\" qachon yozilgan?",
                    "ru": "Когда написан «Кутадгу билиг»?"
                },
                "options": [
                    {
                        "uz": "1069",
                        "ru": "1069"
                    },
                    {
                        "uz": "1082",
                        "ru": "1082"
                    },
                    {
                        "uz": "1500",
                        "ru": "1500"
                    },
                    {
                        "uz": "825",
                        "ru": "825"
                    }
                ],
                "answer": 0
            },
            {
                "q": {
                    "uz": "Bilimni zeriktirmasdan, mavzudan mavzuga oʻtib berishni tavsiya qilgan olim?",
                    "ru": "Кто советовал давать знания, не утомляя и переходя от темы к теме?"
                },
                "options": [
                    {
                        "uz": "Kaykovus",
                        "ru": "Кайкавус"
                    },
                    {
                        "uz": "Beruniy",
                        "ru": "Беруни"
                    },
                    {
                        "uz": "Yusuf Xos Hojib",
                        "ru": "Юсуф Хас Хаджиб"
                    },
                    {
                        "uz": "Forobiy",
                        "ru": "Фараби"
                    }
                ],
                "answer": 1
            },
            {
                "q": {
                    "uz": "Ustoz va muallim roli haqidagi \"Mahbub ul-qulub\" muallifi?",
                    "ru": "Автор «Махбуб ул-кулуб» о роли наставника?"
                },
                "options": [
                    {
                        "uz": "Navoiy",
                        "ru": "Навои"
                    },
                    {
                        "uz": "Ibn Sino",
                        "ru": "Ибн Сина"
                    },
                    {
                        "uz": "Kaykovus",
                        "ru": "Кайкавус"
                    },
                    {
                        "uz": "Beruniy",
                        "ru": "Беруни"
                    }
                ],
                "answer": 0
            }
        ],
        "pairs": [
            {
                "left": {
                    "uz": "Forobiy",
                    "ru": "Фараби"
                },
                "right": {
                    "uz": "\"Fozil odamlar shahri\"",
                    "ru": "«Город добродетельных людей»"
                }
            },
            {
                "left": {
                    "uz": "Yusuf Xos Hojib",
                    "ru": "Юсуф Хас Хаджиб"
                },
                "right": {
                    "uz": "\"Qutadgʻu bilig\"",
                    "ru": "«Кутадгу билиг»"
                }
            },
            {
                "left": {
                    "uz": "Kaykovus",
                    "ru": "Кайкавус"
                },
                "right": {
                    "uz": "\"Qobusnoma\"",
                    "ru": "«Кабус-наме»"
                }
            },
            {
                "left": {
                    "uz": "Navoiy",
                    "ru": "Навои"
                },
                "right": {
                    "uz": "\"Mahbub ul-qulub\"",
                    "ru": "«Махбуб ул-кулуб»"
                }
            },
            {
                "left": {
                    "uz": "Ibn Sino",
                    "ru": "Ибн Сина"
                },
                "right": {
                    "uz": "Bolani guruhda oʻqitish gʻoyasi",
                    "ru": "Идея группового обучения детей"
                }
            }
        ],
        "caseTask": {
            "uz": "Beruniyning \"bilimni zeriktirmasdan, mavzudan mavzuga oʻtib berish\" gʻoyasini bugungi onlayn kurs (masalan, Python kursi) uchun qoʻllang. Kurs tuzilmasini qanday oʻzgartirgan boʻlardingiz? Forobiy yoki Ibn Sinoning yana bir gʻoyasini qoʻshib, 8–10 jumlada yozing.",
            "ru": "Примените идею Беруни «давать знания, не утомляя, переходя от темы к теме» к современному онлайн-курсу (например, по Python). Как бы вы изменили структуру курса? Добавьте ещё одну идею Фараби или Ибн Сины и опишите в 8–10 предложениях."
        }
    },
    {
        "id": "P4",
        "kind": "practice",
        "title": {
            "uz": "Ijtimoiy muhitning shaxs shakllanishiga taʼsiri. Shaxslararo munosabatlar",
            "ru": "Влияние социальной среды на формирование личности. Межличностные отношения"
        },
        "explain": {
            "uz": [
                {
                    "p": "Shaxs shakllanishiga toʻrt omil taʼsir qiladi: irsiyat, muhit, tarbiya va shaxsning oʻz faolligi. Sotsializatsiya — insonning jamiyat meʼyorlari, qadriyatlari va rollarini oʻzlashtirish jarayoni. Uning asosiy institutlari: oila, taʼlim muassasasi, tengdoshlar guruhi, ommaviy axborot vositalari va bugungi kunda ijtimoiy tarmoqlar. Referent guruh — shaxs oʻz fikri va xatti-harakatini moslaydigan, uning uchun ahamiyatli guruh."
                },
                {
                    "p": "Shaxslararo munosabatlarni oʻrganish uchun J. Moreno sotsiometriya metodini yaratgan. Unda guruhda kim yetakchi (\"yulduz\"), kim yakkalangan ekani aniqlanadi."
                },
                {
                    "p": "Nizolarda xulq-atvorning beshta uslubi bor (Tomas–Kilmann modeli): raqobat, hamkorlik, murosa, chetlanish va moslashish."
                }
            ],
            "ru": [
                {
                    "p": "На формирование личности влияют четыре фактора: наследственность, среда, воспитание и собственная активность личности. Социализация — процесс усвоения человеком норм, ценностей и ролей общества. Её основные институты: семья, учебное заведение, группа сверстников, СМИ, а сегодня и социальные сети. Референтная группа — значимая для человека группа, на которую он ориентирует свои мнения и поведение."
                },
                {
                    "p": "Для изучения межличностных отношений Дж. Морено создал метод социометрии. С его помощью выявляют, кто в группе лидер («звезда»), а кто изолирован."
                },
                {
                    "p": "В конфликте выделяют пять стилей поведения (модель Томаса–Килманна): соперничество, сотрудничество, компромисс, избегание и приспособление."
                }
            ]
        },
        "concepts": {
            "uz": [
                "sotsializatsiya",
                "referent guruh",
                "sotsiometriya",
                "yetakchi",
                "nizo",
                "hamkorlik"
            ],
            "ru": [
                "социализация",
                "референтная группа",
                "социометрия",
                "лидер",
                "конфликт",
                "сотрудничество"
            ]
        },
        "tests": [
            {
                "q": {
                    "uz": "Sotsiometriya metodining muallifi?",
                    "ru": "Автор метода социометрии?"
                },
                "options": [
                    {
                        "uz": "J. Moreno",
                        "ru": "Дж. Морено"
                    },
                    {
                        "uz": "K. Levin",
                        "ru": "К. Левин"
                    },
                    {
                        "uz": "A. Maslou",
                        "ru": "А. Маслоу"
                    },
                    {
                        "uz": "I. Pavlov",
                        "ru": "И. Павлов"
                    }
                ],
                "answer": 0
            },
            {
                "q": {
                    "uz": "Shaxs oʻz xulqini moslaydigan ahamiyatli guruh?",
                    "ru": "Значимая группа, на которую человек ориентирует поведение?"
                },
                "options": [
                    {
                        "uz": "Tasodifiy guruh",
                        "ru": "Случайная группа"
                    },
                    {
                        "uz": "Referent guruh",
                        "ru": "Референтная группа"
                    },
                    {
                        "uz": "Rasmiy guruh",
                        "ru": "Формальная группа"
                    },
                    {
                        "uz": "Olomon",
                        "ru": "Толпа"
                    }
                ],
                "answer": 1
            },
            {
                "q": {
                    "uz": "Ikkala tomon ham toʻliq yutadigan nizo uslubi?",
                    "ru": "Стиль конфликта, где выигрывают обе стороны полностью?"
                },
                "options": [
                    {
                        "uz": "Murosa",
                        "ru": "Компромисс"
                    },
                    {
                        "uz": "Raqobat",
                        "ru": "Соперничество"
                    },
                    {
                        "uz": "Hamkorlik",
                        "ru": "Сотрудничество"
                    },
                    {
                        "uz": "Chetlanish",
                        "ru": "Избегание"
                    }
                ],
                "answer": 2
            },
            {
                "q": {
                    "uz": "Shaxs shakllanishi omillariga kirmaydi:",
                    "ru": "Не относится к факторам формирования личности:"
                },
                "options": [
                    {
                        "uz": "Irsiyat",
                        "ru": "Наследственность"
                    },
                    {
                        "uz": "Muhit",
                        "ru": "Среда"
                    },
                    {
                        "uz": "Tarbiya",
                        "ru": "Воспитание"
                    },
                    {
                        "uz": "Ob-havo",
                        "ru": "Погода"
                    }
                ],
                "answer": 3
            },
            {
                "q": {
                    "uz": "Jamiyat meʼyorlarini oʻzlashtirish jarayoni?",
                    "ru": "Процесс усвоения норм общества?"
                },
                "options": [
                    {
                        "uz": "Sotsializatsiya",
                        "ru": "Социализация"
                    },
                    {
                        "uz": "Adaptatsiya",
                        "ru": "Адаптация"
                    },
                    {
                        "uz": "Identifikatsiya",
                        "ru": "Идентификация"
                    },
                    {
                        "uz": "Refleksiya",
                        "ru": "Рефлексия"
                    }
                ],
                "answer": 0
            }
        ],
        "pairs": [
            {
                "left": {
                    "uz": "Raqobat",
                    "ru": "Соперничество"
                },
                "right": {
                    "uz": "Faqat oʻz manfaatini koʻzlash",
                    "ru": "Отстаивание только своих интересов"
                }
            },
            {
                "left": {
                    "uz": "Hamkorlik",
                    "ru": "Сотрудничество"
                },
                "right": {
                    "uz": "Ikkala tomonni qoniqtiradigan yechim izlash",
                    "ru": "Поиск решения, устраивающего обе стороны"
                }
            },
            {
                "left": {
                    "uz": "Murosa",
                    "ru": "Компромисс"
                },
                "right": {
                    "uz": "Har bir tomon qisman yon beradi",
                    "ru": "Каждая сторона частично уступает"
                }
            },
            {
                "left": {
                    "uz": "Chetlanish",
                    "ru": "Избегание"
                },
                "right": {
                    "uz": "Nizodan qochish, muammoni kechiktirish",
                    "ru": "Уход от конфликта, откладывание проблемы"
                }
            },
            {
                "left": {
                    "uz": "Moslashish",
                    "ru": "Приспособление"
                },
                "right": {
                    "uz": "Oʻz manfaatidan voz kechib, boshqaga yon berish",
                    "ru": "Отказ от своих интересов в пользу другого"
                }
            }
        ],
        "caseTask": {
            "uz": "Guruh loyihasida (4 talaba) ikki talaba texnologiya tanlovida kelisha olmayapti: biri Python, ikkinchisi JavaScript'ni talab qilmoqda. Uchinchi talaba umuman gapirmayapti, toʻrtinchisi esa hammasiga rozi. Har bir talabaning xulq uslubini Tomas–Kilmann modeli boʻyicha aniqlang. Jamoa sardori sifatida nizoni hamkorlik uslubida qanday hal qilasiz?",
            "ru": "В групповом проекте (4 студента) двое не могут договориться о выборе технологии: один настаивает на Python, другой — на JavaScript. Третий студент молчит, четвёртый со всеми соглашается. Определите стиль поведения каждого по модели Томаса–Килманна. Как вы, как лидер команды, решите конфликт в стиле сотрудничества?"
        }
    },
    {
        "id": "P9",
        "kind": "practice",
        "title": {
            "uz": "Axborot urushining media-psixologik manbalari",
            "ru": "Медиапсихологические источники информационной войны"
        },
        "explain": {
            "uz": [
                {
                    "p": "Axborot urushi — axborot va ommaviy kommunikatsiya vositalari orqali insonlar ongi, kayfiyati va qarorlariga maqsadli taʼsir koʻrsatish. Uning media-psixologik manbalari: yangilik saytlari, televideniye, ijtimoiy tarmoqlar, messenjer kanallari, botlar va soxta akkauntlar."
                },
                {
                    "p": "Asosiy manipulyatsiya usullari:"
                },
                {
                    "ul": [
                        "soxta yangilik (feyk);",
                        "deepfake — sunʼiy intellekt yordamida yasalgan soxta video yoki ovoz;",
                        "\"yorliq yopishtirish\" — faktsiz salbiy nom berish;",
                        "tanlab yoritish — faktlarning faqat bir qismini koʻrsatish;",
                        "koʻp takrorlash — yolgʻonni tanish va \"rost\"dek qilish;",
                        "qoʻrquv va gʻazabga murojaat qilish."
                    ]
                },
                {
                    "p": "Ijtimoiy tarmoq algoritmlari \"axborot pufagi\" (filter bubble) va \"aks-sado xonasi\" (echo chamber) hosil qiladi: inson faqat oʻz fikrini tasdiqlovchi kontentni koʻradi."
                },
                {
                    "p": "Himoya usullari: manbani tekshirish, bir necha mustaqil manbani solishtirish, sana va muallifni aniqlash, rasmni teskari qidiruv bilan tekshirish, his-hayajonga berilmasdan tanqidiy fikrlash, yaʼni media savodxonlik."
                }
            ],
            "ru": [
                {
                    "p": "Информационная война — целенаправленное воздействие на сознание, настроение и решения людей через информацию и средства массовой коммуникации. Её медиапсихологические источники: новостные сайты, телевидение, социальные сети, мессенджер-каналы, боты и фейковые аккаунты."
                },
                {
                    "p": "Основные приёмы манипуляции:"
                },
                {
                    "ul": [
                        "фейковые новости;",
                        "дипфейк — поддельное видео или голос, созданные с помощью ИИ;",
                        "«навешивание ярлыков» — негативные названия без фактов;",
                        "избирательное освещение — показ только части фактов;",
                        "многократное повторение — ложь становится знакомой и «правдоподобной»;",
                        "апелляция к страху и гневу."
                    ]
                },
                {
                    "p": "Алгоритмы соцсетей создают «информационный пузырь» (filter bubble) и «эхо-камеру» (echo chamber): человек видит только контент, подтверждающий его мнение."
                },
                {
                    "p": "Методы защиты: проверка источника, сравнение нескольких независимых источников, установление даты и автора, обратный поиск изображения, критическое мышление без поддачи эмоциям, то есть медиаграмотность."
                }
            ]
        },
        "concepts": {
            "uz": [
                "axborot urushi",
                "manipulyatsiya",
                "feyk",
                "deepfake",
                "axborot pufagi",
                "media savodxonlik"
            ],
            "ru": [
                "информационная война",
                "манипуляция",
                "фейк",
                "дипфейк",
                "информационный пузырь",
                "медиаграмотность"
            ]
        },
        "tests": [
            {
                "q": {
                    "uz": "Sunʼiy intellekt bilan yasalgan soxta video?",
                    "ru": "Поддельное видео, созданное ИИ?"
                },
                "options": [
                    {
                        "uz": "Feyk",
                        "ru": "Фейк"
                    },
                    {
                        "uz": "Deepfake",
                        "ru": "Дипфейк"
                    },
                    {
                        "uz": "Spam",
                        "ru": "Спам"
                    },
                    {
                        "uz": "Mem",
                        "ru": "Мем"
                    }
                ],
                "answer": 1
            },
            {
                "q": {
                    "uz": "Inson faqat oʻz fikrini tasdiqlovchi kontentni koʻradigan holat?",
                    "ru": "Ситуация, когда человек видит только подтверждающий его мнение контент?"
                },
                "options": [
                    {
                        "uz": "Axborot pufagi",
                        "ru": "Информационный пузырь"
                    },
                    {
                        "uz": "Media savodxonlik",
                        "ru": "Медиаграмотность"
                    },
                    {
                        "uz": "Fakt-cheking",
                        "ru": "Фактчекинг"
                    },
                    {
                        "uz": "Reyting",
                        "ru": "Рейтинг"
                    }
                ],
                "answer": 0
            },
            {
                "q": {
                    "uz": "Yolgʻonni koʻp takrorlash qanday taʼsir beradi?",
                    "ru": "Каков эффект многократного повторения лжи?"
                },
                "options": [
                    {
                        "uz": "Unutiladi",
                        "ru": "Забывается"
                    },
                    {
                        "uz": "Tanish va rostdek tuyuladi",
                        "ru": "Кажется знакомой и правдивой"
                    },
                    {
                        "uz": "Kulgili boʻladi",
                        "ru": "Становится смешной"
                    },
                    {
                        "uz": "Taʼsir qilmaydi",
                        "ru": "Не влияет"
                    }
                ],
                "answer": 1
            },
            {
                "q": {
                    "uz": "Rasm haqiqiyligini tekshirishning eng oddiy usuli?",
                    "ru": "Самый простой способ проверить подлинность фото?"
                },
                "options": [
                    {
                        "uz": "Layklar soni",
                        "ru": "Число лайков"
                    },
                    {
                        "uz": "Teskari qidiruv",
                        "ru": "Обратный поиск"
                    },
                    {
                        "uz": "Izohlarni oʻqish",
                        "ru": "Чтение комментариев"
                    },
                    {
                        "uz": "Doʻstga yuborish",
                        "ru": "Отправить другу"
                    }
                ],
                "answer": 1
            },
            {
                "q": {
                    "uz": "Faktlarning faqat bir qismini koʻrsatish usuli?",
                    "ru": "Приём показа только части фактов?"
                },
                "options": [
                    {
                        "uz": "Tanlab yoritish",
                        "ru": "Избирательное освещение"
                    },
                    {
                        "uz": "Deepfake",
                        "ru": "Дипфейк"
                    },
                    {
                        "uz": "Takrorlash",
                        "ru": "Повторение"
                    },
                    {
                        "uz": "Yorliq",
                        "ru": "Ярлык"
                    }
                ],
                "answer": 0
            }
        ],
        "pairs": [
            {
                "left": {
                    "uz": "Feyk",
                    "ru": "Фейк"
                },
                "right": {
                    "uz": "Ataylab tarqatilgan yolgʻon xabar",
                    "ru": "Намеренно распространяемая ложная новость"
                }
            },
            {
                "left": {
                    "uz": "Deepfake",
                    "ru": "Дипфейк"
                },
                "right": {
                    "uz": "SI bilan yasalgan soxta video yoki ovoz",
                    "ru": "Поддельное видео или голос, созданные ИИ"
                }
            },
            {
                "left": {
                    "uz": "Yorliq yopishtirish",
                    "ru": "Навешивание ярлыков"
                },
                "right": {
                    "uz": "Faktsiz salbiy nom berish",
                    "ru": "Негативное название без фактов"
                }
            },
            {
                "left": {
                    "uz": "Aks-sado xonasi",
                    "ru": "Эхо-камера"
                },
                "right": {
                    "uz": "Bir xil fikrlar takrorlanadigan muhit",
                    "ru": "Среда, где повторяются одинаковые мнения"
                }
            },
            {
                "left": {
                    "uz": "Media savodxonlik",
                    "ru": "Медиаграмотность"
                },
                "right": {
                    "uz": "Axborotni tanqidiy baholash koʻnikmasi",
                    "ru": "Навык критической оценки информации"
                }
            }
        ],
        "caseTask": {
            "uz": "Telegram kanalda \"Ertadan barcha talabalarning stipendiyasi bekor qilinadi!\" degan xabar va hujjat surati tarqaldi. Xabar 50 ming marta koʻrilgan, manba koʻrsatilmagan. Bu xabarda qaysi manipulyatsiya belgilari bor? Uni tekshirish uchun 4 ta aniq qadamni yozing. Siz bu xabarni guruhingizda koʻrsangiz, qanday javob berasiz?",
            "ru": "В Telegram-канале распространилось сообщение «С завтрашнего дня всем студентам отменят стипендию!» с фото документа. Его просмотрели 50 тысяч раз, источник не указан. Какие признаки манипуляции есть в сообщении? Напишите 4 конкретных шага для его проверки. Как вы ответите, если увидите это сообщение в своей группе?"
        }
    }
];

/** Ballar: test — har bir toʻgʻri javob 1 ball; moslashtirish — 5 dan xatolar soni ayiriladi; keys — oʻqituvchi 0–10. */
export const CASE_MAX = 10;

export const audTopic = (id: string) => AUD_TOPICS.find(t => t.id === id);
