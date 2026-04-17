const fs = require('fs');

const pathUz = './messages/uz.json';
const pathRu = './messages/ru.json';
const pathEn = './messages/en.json';

const getTexts = (lang) => {
    let result = {};
    if (lang === 'uz') {
        result = {
            HomeExtras: {
                articlesTitle: "Maqolalar va Ilmiy Yangiliklar",
                articlesSubtitle: "Ta'lim va texnologiya tendensiyalari",
                allArticles: "Barcha maqolalar",
                readMore: "Batafsil",
                footerLinks: {
                    blog: "Blog",
                    pricing: "Tariflar",
                    author: "Muallif",
                    support: "Yordam",
                    about: "Haqimizda",
                    privacy: "Maxfiylik",
                    terms: "Shartlar"
                }
            },
            SocialProof: {
                subtitle: "O'zbekiston o'qituvchilari ishonadi",
                teachers: "O'qituvchi ishlatadi",
                quizzes: "Quiz o'tkazildi",
                games: "Xil o'yin turi"
            },
            HowItWorks: {
                subtitle: "Bosqichlar",
                title: "Qanday ishlaydi?",
                desc: "3 qadamda interaktiv dars boshlang",
                steps: {
                    step1: {
                        title: "Quiz yarating",
                        desc: "Mavzu kiriting — AI avtomatik savollar tayyorlab beradi. Yoki o'zingiz qo'lda yozasiz. 2 daqiqa yetarli."
                    },
                    step2: {
                        title: "O'quvchilarni ulang",
                        desc: "Ekranda ko'rsatilgan PIN-kod yoki QR-kodni o'quvchilarga yuboring. Hech qanday ro'yxatdan o'tish shart emas."
                    },
                    step3: {
                        title: "O'ynang va o'rganing",
                        desc: "Real-vaqt rejimida reyting, animatsiyalar, va tezkor teskari aloqa. Dars qiziqarli — natija sezilarli."
                    }
                }
            },
            Articles: {
                "zamonaviy-talimda-gamifikatsiyaning-orni": {
                    "title": "Zamonaviy ta'limda gamifikatsiyaning o'rni: Nega o'yinlar darsdan ko'ra yaxshiroq o'rgatadi?",
                    "excerpt": "An'anaviy dars va o'yinli darsning samaradorligi o'rtasidagi farq haqida ilmiy va amaliy tushunchalar."
                },
                "suniy-intellekt-va-talim-texnologiyalari": {
                    "title": "Sun'iy intellekt va ta'lim texnologiyalari: 2026-yil tendensiyalari",
                    "excerpt": "AI dars jarayonini qanday individuallashtirishi mumkinligi haqida tahliliy maqola."
                },
                "malumotlar-tahlili-va-monitoring": {
                    "title": "Ma'lumotlar tahlili va monitoring: Gidrologik ko'rsatkichlardan ta'lim metrikalarigacha",
                    "excerpt": "Gidrologik monitoring va ma'lumotlar bilan ishlash malakasini ta'lim tizimidagi tahlillarga bog'lash."
                },
                "kahoot-va-zukkoo-taqqoslash-2026": {
                    "title": "Kahoot va Zukkoo: Qaysi Biri O'zbek O'qituvchilari Uchun Yaxshi? (2026 Taqqoslash)",
                    "excerpt": "Kahoot va Zukkoo o'rtasidagi farqni bilmoqchimisiz? Narx, funksiyalar, o'zbek tili va foydalanish qulayligi bo'yicha 2026-yilgi to'liq taqqoslash."
                },
                "5-daqiqada-quiz-yaratish-oquvchilar-uchun": {
                    "title": "5 Daqiqada Online Quiz Yarating: O'qituvchilar uchun To'liq Qo'llanma",
                    "excerpt": "O'qituvchi sifatida 5 daqiqada interaktiv quiz yaratmoqchimisiz? Zukkoo.uz orqali bosqichma-bosqich qo'llanma — tayyorlash, o'tkazish, natijalarni ko'rish."
                },
                "gamifikatsiya-nima-talimda-qollanish": {
                    "title": "Gamifikatsiya Nima va U Ta'limni Qanday O'zgartiradi?",
                    "excerpt": "Gamifikatsiya — bu shunchaki o'yin emas. U o'quvchilarning motivatsiyasini 48% gacha oshiradi. Ilmiy asoslar va Zukkoo orqali amaliy misollar."
                },
                "ozbekistonda-raqamli-talim-2026": {
                    "title": "O'zbekistonda Raqamli Ta'lim 2026: Holat, Muammolar va Yechimlar",
                    "excerpt": "O'zbekistonda raqamli ta'lim 2026-yilda qayerda turибди? Maktablar, universitetlar va o'qituvchilar oldidagi asosiy muammolar va amaliy yechimlar."
                },
                "maktab-darsida-viktorina-10-maslahat": {
                    "title": "Maktab Darsida Viktorina O'tkazish: 10 Ta Amaliy Maslahat",
                    "excerpt": "Darsda viktorina o'tkazmoqchimisiz? O'zbek o'qituvchilari uchun 10 ta amaliy maslahat — savollar yozishdan tortib natijalarni tahlil qilishgacha."
                },
                "malumotlar-dinamikasini-monitoring-qilish": {
                    "title": "Ma'lumotlar dinamikasini monitoring qilish: Gidrologik modellardan ta'lim tizimlarigacha",
                    "excerpt": "Gidrologik vaqt qatorlari monitoringidan olingan ilmiy metodologiya qanday qilib intellektual ta'lim tizimlarini yaxshilashini tahlili."
                },
                "ozbekistonda-interaktiv-talim-2026": {
                    "title": "O'zbekistonda interaktiv ta'lim: Dars samaradorligini oshirishning 5 usuli",
                    "excerpt": "O'qituvchilar uchun qo'llanma: zamonaviy bolalarning diqqatini ushlab turish va gamifikatsiya yordamida o'qitish."
                },
                "neyropedagogika-va-gamifikatsiya": {
                    "title": "Neyropedagogika va Gamifikatsiya: Nega an'anaviy testlar o'rnini o'yinlar egallamoqda?",
                    "excerpt": "Miya ma'lumotni qanday qabul qiladi va dopamin mexanizmi ta'limni qanday tezlashtiradi."
                }
            }
        };
    } else if (lang === 'ru') {
        result = {
            HomeExtras: {
                articlesTitle: "Статьи и Научные Новости",
                articlesSubtitle: "Тренды в образовании и технологиях",
                allArticles: "Все статьи",
                readMore: "Подробнее",
                footerLinks: {
                    blog: "Блог",
                    pricing: "Тарифы",
                    author: "Автор",
                    support: "Помощь",
                    about: "О нас",
                    privacy: "Конфиденциальность",
                    terms: "Условия"
                }
            },
            SocialProof: {
                subtitle: "Учителя Узбекистана доверяют",
                teachers: "Используют учителя",
                quizzes: "Проведено Quiz",
                games: "Видов игр"
            },
            HowItWorks: {
                subtitle: "Этапы",
                title: "Как это работает?",
                desc: "Начните интерактивный урок за 3 шага",
                steps: {
                    step1: {
                        title: "Создайте Quiz",
                        desc: "Введите тему — ИИ автоматически подготовит вопросы. Или напишите вручную. Достаточно 2 минут."
                    },
                    step2: {
                        title: "Подключите учеников",
                        desc: "Отправьте ученикам PIN-код или QR-код на экране. Регистрация не требуется."
                    },
                    step3: {
                        title: "Играйте и учитесь",
                        desc: "Рейтинг в реальном времени, анимация и мгновенная обратная связь. Урок интересный — результат заметный."
                    }
                }
            },
            Articles: {
                "zamonaviy-talimda-gamifikatsiyaning-orni": {
                    "title": "Роль геймификации в современном образовании",
                    "excerpt": "Научные и практические концепции о разнице между эффективностью традиционных и игровых уроков."
                },
                "suniy-intellekt-va-talim-texnologiyalari": {
                    "title": "Искусственный интеллект и образовательные технологии: тренды 2026 года",
                    "excerpt": "Аналитическая статья о том, как ИИ может индивидуализировать учебный процесс."
                },
                "malumotlar-tahlili-va-monitoring": {
                    "title": "Анализ данных и мониторинг: От гидрологических показателей до метрик образования",
                    "excerpt": "Связь гидрологического мониторинга и работы с данными в образовательных системах."
                },
                "kahoot-va-zukkoo-taqqoslash-2026": {
                    "title": "Kahoot и Zukkoo: Что лучше для учителей Узбекистана?",
                    "excerpt": "Хотите знать разницу? Полное сравнение 2026 года по ценам, функциям и локализации."
                },
                "5-daqiqada-quiz-yaratish-oquvchilar-uchun": {
                    "title": "Создайте онлайн-викторину за 5 минут: Руководство для учителей",
                    "excerpt": "Пошаговое руководство по созданию интерактивной викторины — подготовка, проведение, результаты."
                },
                "gamifikatsiya-nima-talimda-qollanish": {
                    "title": "Что такое геймификация и как она меняет образование?",
                    "excerpt": "Это не просто игра. Геймификация помогает повысить вовлеченность на 48%."
                },
                "ozbekistonda-raqamli-talim-2026": {
                    "title": "Цифровое образование в Узбекистане 2026: Состояние и решения",
                    "excerpt": "Где находится цифровое образование в 2026 году? Основные проблемы и решения для школ."
                },
                "maktab-darsida-viktorina-10-maslahat": {
                    "title": "Проведение викторины на школьном уроке: 10 практических советов",
                    "excerpt": "10 практических советов для учителей — от написания вопросов до анализа результатов."
                },
                "malumotlar-dinamikasini-monitoring-qilish": {
                    "title": "Мониторинг динамики данных в интеллектуальных системах образования",
                    "excerpt": "Как методология гидрологического мониторинга улучшает образовательные технологии."
                },
                "ozbekistonda-interaktiv-talim-2026": {
                    "title": "Интерактивное обучение в Узбекистане: 5 способа повысить эффективность урока",
                    "excerpt": "Практическое руководство для учителей: удержание внимания и геймификация с Zukkoo."
                },
                "neyropedagogika-va-gamifikatsiya": {
                    "title": "Нейропедагогика и Геймификация: Почему игры заменяют классические тесты?",
                    "excerpt": "Как мозг воспринимает информацию и как механизм дофамина ускоряет обучение."
                }
            }
        };
    } else {
        result = {
            HomeExtras: {
                articlesTitle: "Articles & Insights",
                articlesSubtitle: "Education and technology trends",
                allArticles: "View all articles",
                readMore: "Read more",
                footerLinks: {
                    blog: "Blog",
                    pricing: "Pricing",
                    author: "Author",
                    support: "Support",
                    about: "About Us",
                    privacy: "Privacy",
                    terms: "Terms"
                }
            },
            SocialProof: {
                subtitle: "Trusted by Uzbekistan teachers",
                teachers: "Teachers using",
                quizzes: "Quizzes hosted",
                games: "Game modes"
            },
            HowItWorks: {
                subtitle: "Steps",
                title: "How it works?",
                desc: "Start an interactive lesson in 3 steps",
                steps: {
                    step1: {
                        title: "Create Quiz",
                        desc: "Enter a topic - AI automatically prepares questions. Or type manually. 2 minutes is enough."
                    },
                    step2: {
                        title: "Connect students",
                        desc: "Send the PIN or QR code to your students. No sign-up required."
                    },
                    step3: {
                        title: "Play and Learn",
                        desc: "Real-time leaderboard, animations, and instant feedback. Fun lessons — visible results."
                    }
                }
            },
            Articles: {
                "zamonaviy-talimda-gamifikatsiyaning-orni": {
                    "title": "The Role of Gamification in Modern Education",
                    "excerpt": "Scientific and practical insights on why games teach better than traditional lessons."
                },
                "suniy-intellekt-va-talim-texnologiyalari": {
                    "title": "Artificial Intelligence and EdTech: 2026 Trends",
                    "excerpt": "Analytical article on how AI can individualize the learning process."
                },
                "malumotlar-tahlili-va-monitoring": {
                    "title": "Data Analysis and Monitoring in Education",
                    "excerpt": "Connecting hydrological monitoring and data skills to educational analytics."
                },
                "kahoot-va-zukkoo-taqqoslash-2026": {
                    "title": "Kahoot vs Zukkoo: Which is Better for Teachers?",
                    "excerpt": "Want to know the difference? A full 2026 comparison by price, features, and localization."
                },
                "5-daqiqada-quiz-yaratish-oquvchilar-uchun": {
                    "title": "Create an Online Quiz in 5 Minutes: Teacher's Guide",
                    "excerpt": "Want to create a quiz fast? Step-by-step guide with Zukkoo — prepare, host, review."
                },
                "gamifikatsiya-nima-talimda-qollanish": {
                    "title": "What is Gamification and How it Changes Learning?",
                    "excerpt": "It's not just a game. Gamification increases motivation by 48%. Scientific facts and examples."
                },
                "ozbekistonda-raqamli-talim-2026": {
                    "title": "Digital Education in Uzbekistan 2026",
                    "excerpt": "Where does digital education stand in 2026? Main challenges and practical solutions."
                },
                "maktab-darsida-viktorina-10-maslahat": {
                    "title": "Hosting Quizzes in Class: 10 Practical Tips",
                    "excerpt": "10 practical tips for teachers — from writing questions to analyzing results."
                },
                "malumotlar-dinamikasini-monitoring-qilish": {
                    "title": "Monitoring Data Dynamics in Intelligent Education Systems",
                    "excerpt": "How the methodology of hydrological monitoring improves educational technology."
                },
                "ozbekistonda-interaktiv-talim-2026": {
                    "title": "Interactive Education: 5 Innovative Ways to Boost Efficiency",
                    "excerpt": "A practical guide for teachers: keeping students' attention and teaching via gamification."
                },
                "neyropedagogika-va-gamifikatsiya": {
                    "title": "Neuropedagogy and Gamification: Why games replace traditional tests",
                    "excerpt": "How the brain receives information and how the dopamine mechanism accelerates learning."
                }
            }
        };
    }
    return result;
}

const updateJson = (filepath, lang) => {
    try {
        let data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        const additions = getTexts(lang);
        
        // Add inside Home
        data.Home = {
            ...data.Home,
            ...additions.HomeExtras
        };
        
        // Add Root keys
        data.SocialProof = additions.SocialProof;
        data.HowItWorks = additions.HowItWorks;
        data.Articles = additions.Articles;

        fs.writeFileSync(filepath, JSON.stringify(data, null, 4), 'utf8');
        console.log(`Updated ${filepath}`);
    } catch (e) {
        console.error(`Error updating ${filepath}:`, e);
    }
}

updateJson(pathUz, 'uz');
updateJson(pathRu, 'ru');
updateJson(pathEn, 'en');

