import type { EngQuestion } from './engRace';

// [mavzu, savol, variantlar, to'g'ri javob indeksi, izoh]
type Row = [string, string, string[], number, string];
const build = (rows: Row[]): EngQuestion[] =>
    rows.map(([topic, q, options, i, explain]) => ({ topic, q, options, answer: options[i], explain }));

/* ─────────────── IQTISODIYOTDA AKT — o'zbekcha ─────────────── */
export const IT_ECON_UZ = build([
    ['Excel', "Excel'da kataklardagi sonlar yig'indisini hisoblaydigan funksiya qaysi?", ['SUM', 'COUNT', 'MAX', 'IF'], 0, "SUM — berilgan diapazondagi sonlarni qo'shadi."],
    ['Excel', '=AVERAGE(B2:B10) formulasi nimani hisoblaydi?', ["O'rtacha qiymatni", "Yig'indini", 'Eng katta qiymatni', 'Kataklar sonini'], 0, "AVERAGE — o'rtacha arifmetik qiymat."],
    ['Excel', "Formula nusxalanganda o'zgarmaydigan (absolyut) havola qaysi?", ['$A$1', 'A1', 'A$1:B', '#A1'], 0, "$ belgisi ustun va qatorni qotiradi: $A$1."],
    ['Excel', 'Shartga qarab turli natija qaytaradigan funksiya qaysi?', ['IF', 'SUM', 'ROUND', 'LEN'], 0, 'IF(shart; rost bo\'lsa; yolg\'on bo\'lsa).'],
    ['Excel', 'Jadvaldan kerakli qiymatni qidirib topadigan funksiya qaysi?', ['VLOOKUP', 'COUNTIF', 'TODAY', 'CONCAT'], 0, 'VLOOKUP — vertikal qidiruv (masalan, mahsulot kodi bo\'yicha narx).'],
    ['Excel', "Katta jadvalni guruhlab, tezkor hisobot tuzadigan vosita qaysi?", ["Yig'ma jadval (PivotTable)", 'Shrift', 'Sahifa chegarasi', 'Izoh (Comment)'], 0, "PivotTable ma'lumotlarni guruhlab, yig'indi va o'rtachalarni bir zumda hisoblaydi."],
    ['Excel', '=ROUND(15,678;1) natijasi nechaga teng?', ['15,7', '15,6', '16', '15,68'], 0, 'ROUND sonni ko\'rsatilgan xonagacha yaxlitlaydi: 1 xona → 15,7.'],
    ['Diagrammalar', "Bozor ulushlarini (qismlarning butundagi hissasini) ko'rsatish uchun eng mos diagramma?", ['Doiraviy', 'Chiziqli', 'Nuqtali', 'Gistogramma'], 0, "Doiraviy diagramma — 100% ning qismlarga bo'linishini ko'rsatadi."],
    ['Diagrammalar', "Narx yoki daromadning vaqt bo'yicha o'zgarishini ko'rsatish uchun mos diagramma?", ['Chiziqli grafik', 'Doiraviy', 'Halqasimon', 'Jadval'], 0, "Dinamika (vaqt bo'yicha o'zgarish) — chiziqli grafikda yaxshi ko'rinadi."],
    ['Dasturlar', "O'zbekistonda buxgalteriya hisobi uchun keng qo'llaniladigan dastur?", ['1C: Buxgalteriya', 'Photoshop', 'AutoCAD', 'PowerPoint'], 0, '1C — buxgalteriya, ombor va kadrlar hisobi uchun.'],
    ['Dasturlar', "Korxonaning moliya, ombor va kadrlarini yagona tizimda boshqaradigan dastur turi?", ['ERP', 'CRM', 'CMS', 'VPN'], 0, 'ERP — Enterprise Resource Planning (korxona resurslarini rejalashtirish).'],
    ['Dasturlar', 'Mijozlar bilan munosabatlarni boshqarish tizimi qanday ataladi?', ['CRM', 'ERP', 'SQL', 'HTML'], 0, 'CRM — Customer Relationship Management.'],
    ["Ma'lumotlar bazasi", "Ma'lumotlar bazasidan so'rov orqali ma'lumot olish tili?", ['SQL', 'HTML', 'CSS', 'PDF'], 0, 'SQL — Structured Query Language.'],
    ['Elektron tijorat', "Kompaniya internet orqali to'g'ridan-to'g'ri iste'molchiga sotishi qaysi model?", ['B2C', 'B2B', 'C2C', 'G2B'], 0, 'B2C — Business to Consumer (biznes → iste\'molchi).'],
    ['Elektron tijorat', "Kompaniyalar o'rtasidagi elektron savdo qaysi model?", ['B2B', 'B2C', 'C2C', 'C2G'], 0, 'B2B — Business to Business.'],
    ['Elektron tijorat', "OLX kabi saytlarda shaxslarning bir-biriga sotishi qaysi model?", ['C2C', 'B2B', 'B2C', 'G2C'], 0, "C2C — Consumer to Consumer (iste'molchidan iste'molchiga)."],
    ["Elektron hukumat", "Hujjatni elektron tasdiqlovchi, qog'ozdagi imzo o'rnini bosuvchi vosita?", ['Elektron raqamli imzo (ERI)', 'Parol', 'QR-kod', 'Login'], 0, "ERI — elektron hujjatning muallifi va o'zgarmaganini tasdiqlaydi."],
    ["Elektron hukumat", "O'zbekistonda davlat xizmatlarini onlayn olish yagona portali?", ['my.gov.uz', 'olx.uz', 'kun.uz', 'uzum.uz'], 0, 'my.gov.uz — Yagona interaktiv davlat xizmatlari portali.'],
    ["Elektron hukumat", 'Soliq hisobotlarini elektron topshirish uchun rasmiy sayt?', ['soliq.uz', 'lex.uz', 'olx.uz', 'mover.uz'], 0, "soliq.uz — Soliq qo'mitasining rasmiy sayti va shaxsiy kabineti."],
    ['Raqamli moliya', "Ma'lumotlar bloklar zanjirida saqlanadigan, o'zgartirib bo'lmaydigan taqsimlangan reyestr?", ['Blokcheyn', 'Bulutli hisoblash', 'VPN', 'Antivirus'], 0, 'Blokcheyn — kriptovalyutalar va aqlli shartnomalar asosi.'],
    ['Kiberxavfsizlik', "Bank nomidan soxta xat yuborib, karta ma'lumotlarini o'g'irlash usuli?", ['Fishing', 'Spam-filtr', 'Zaxira nusxa', 'Firewall'], 0, 'Fishing — aldov yo\'li bilan parol va karta ma\'lumotlarini olish.'],
    ['Kiberxavfsizlik', "Kirishda parol + SMS-kod talab qilinishi nima deyiladi?", ['Ikki bosqichli autentifikatsiya', 'Shifrlash', 'Arxivlash', 'Formatlash'], 0, "Ikki bosqichli autentifikatsiya parol o'g'irlansa ham akkauntni himoya qiladi."],
    ['Texnologiyalar', "Ma'lumot va dasturlarni internet orqali uzoqdagi serverlarda saqlash va ishlatish?", ['Bulutli hisoblash', 'Lokal tarmoq', 'Defragmentatsiya', 'BIOS'], 0, 'Bulutli hisoblash (cloud): Google Drive, OneDrive va boshqalar.'],
    ['Texnologiyalar', "Juda katta hajmdagi, tez o'zgaruvchi ma'lumotlarni tahlil qilish texnologiyasi?", ['Big Data', 'Word Art', 'Clipboard', 'Spellcheck'], 0, 'Big Data — talabni bashorat qilish, xaridorlar xatti-harakatini tahlil qilishda qo\'llanadi.'],
    ["Axborot o'lchovi", '1 kilobayt (KB) necha baytga teng (ikkilik tizimda)?', ['1024', '1000', '512', '8'], 0, '1 KB = 2¹⁰ = 1024 bayt.'],
]);

/* ─────────────── ИКТ В ЭКОНОМИКЕ — русский ─────────────── */
export const IT_ECON_RU = build([
    ['Excel', 'Какая функция Excel вычисляет сумму чисел в ячейках?', ['SUM (СУММ)', 'COUNT (СЧЁТ)', 'MAX (МАКС)', 'IF (ЕСЛИ)'], 0, 'СУММ складывает числа в указанном диапазоне.'],
    ['Excel', 'Что вычисляет формула =AVERAGE(B2:B10)?', ['Среднее значение', 'Сумму', 'Наибольшее значение', 'Количество ячеек'], 0, 'AVERAGE (СРЗНАЧ) — среднее арифметическое.'],
    ['Excel', 'Какая ссылка не меняется при копировании формулы (абсолютная)?', ['$A$1', 'A1', 'A$1:B', '#A1'], 0, 'Знак $ закрепляет столбец и строку: $A$1.'],
    ['Excel', 'Какая функция возвращает разный результат в зависимости от условия?', ['IF (ЕСЛИ)', 'SUM (СУММ)', 'ROUND (ОКРУГЛ)', 'LEN (ДЛСТР)'], 0, 'ЕСЛИ(условие; если истина; если ложь).'],
    ['Excel', 'Какая функция ищет нужное значение в таблице?', ['VLOOKUP (ВПР)', 'COUNTIF (СЧЁТЕСЛИ)', 'TODAY (СЕГОДНЯ)', 'CONCAT (СЦЕП)'], 0, 'ВПР — вертикальный поиск (например, цена по коду товара).'],
    ['Excel', 'Какой инструмент группирует большую таблицу и быстро строит отчёт?', ['Сводная таблица (PivotTable)', 'Шрифт', 'Граница страницы', 'Примечание'], 0, 'Сводная таблица мгновенно группирует данные и считает итоги.'],
    ['Excel', 'Чему равен результат =ROUND(15,678;1)?', ['15,7', '15,6', '16', '15,68'], 0, 'ОКРУГЛ округляет до указанного числа знаков: 1 знак → 15,7.'],
    ['Диаграммы', 'Какая диаграмма лучше всего показывает доли рынка (части целого)?', ['Круговая', 'Линейная', 'Точечная', 'Гистограмма'], 0, 'Круговая диаграмма показывает деление 100% на части.'],
    ['Диаграммы', 'Какая диаграмма подходит для изменения цены или дохода во времени?', ['Линейный график', 'Круговая', 'Кольцевая', 'Таблица'], 0, 'Динамику во времени лучше всего показывает линейный график.'],
    ['Программы', 'Какая программа широко используется в Узбекистане для бухгалтерского учёта?', ['1С: Бухгалтерия', 'Photoshop', 'AutoCAD', 'PowerPoint'], 0, '1С — для бухгалтерского, складского и кадрового учёта.'],
    ['Программы', 'Как называется система, управляющая финансами, складом и кадрами предприятия в одной программе?', ['ERP', 'CRM', 'CMS', 'VPN'], 0, 'ERP — Enterprise Resource Planning (планирование ресурсов предприятия).'],
    ['Программы', 'Как называется система управления взаимоотношениями с клиентами?', ['CRM', 'ERP', 'SQL', 'HTML'], 0, 'CRM — Customer Relationship Management.'],
    ['Базы данных', 'Какой язык используется для запросов к базе данных?', ['SQL', 'HTML', 'CSS', 'PDF'], 0, 'SQL — Structured Query Language (язык структурированных запросов).'],
    ['Электронная коммерция', 'Компания продаёт через интернет напрямую потребителю. Какая это модель?', ['B2C', 'B2B', 'C2C', 'G2B'], 0, 'B2C — Business to Consumer (бизнес → потребитель).'],
    ['Электронная коммерция', 'Электронная торговля между компаниями — это модель…', ['B2B', 'B2C', 'C2C', 'C2G'], 0, 'B2B — Business to Business.'],
    ['Электронная коммерция', 'Частные лица продают друг другу на сайтах типа OLX. Какая это модель?', ['C2C', 'B2B', 'B2C', 'G2C'], 0, 'C2C — Consumer to Consumer (от потребителя к потребителю).'],
    ['Электронное правительство', 'Что подтверждает электронный документ и заменяет подпись на бумаге?', ['Электронная цифровая подпись (ЭЦП)', 'Пароль', 'QR-код', 'Логин'], 0, 'ЭЦП подтверждает автора документа и то, что он не изменён.'],
    ['Электронное правительство', 'Единый портал онлайн-госуслуг Узбекистана?', ['my.gov.uz', 'olx.uz', 'kun.uz', 'uzum.uz'], 0, 'my.gov.uz — Единый портал интерактивных государственных услуг.'],
    ['Электронное правительство', 'Официальный сайт для электронной сдачи налоговой отчётности?', ['soliq.uz', 'lex.uz', 'olx.uz', 'mover.uz'], 0, 'soliq.uz — официальный сайт и личный кабинет Налогового комитета.'],
    ['Цифровые финансы', 'Как называется распределённый реестр, где данные хранятся цепочкой блоков и их нельзя изменить?', ['Блокчейн', 'Облачные вычисления', 'VPN', 'Антивирус'], 0, 'Блокчейн — основа криптовалют и смарт-контрактов.'],
    ['Кибербезопасность', 'Мошенники присылают письмо от имени банка, чтобы украсть данные карты. Как это называется?', ['Фишинг', 'Спам-фильтр', 'Резервная копия', 'Брандмауэр'], 0, 'Фишинг — получение паролей и данных карт обманным путём.'],
    ['Кибербезопасность', 'Как называется вход по паролю + SMS-коду?', ['Двухфакторная аутентификация', 'Шифрование', 'Архивация', 'Форматирование'], 0, 'Двухфакторная аутентификация защищает аккаунт, даже если пароль украден.'],
    ['Технологии', 'Хранение и использование данных и программ на удалённых серверах через интернет — это…', ['Облачные вычисления', 'Локальная сеть', 'Дефрагментация', 'BIOS'], 0, 'Облачные вычисления (cloud): Google Drive, OneDrive и др.'],
    ['Технологии', 'Технология анализа очень больших и быстро меняющихся данных?', ['Big Data', 'Word Art', 'Буфер обмена', 'Проверка орфографии'], 0, 'Big Data применяют для прогноза спроса и анализа поведения покупателей.'],
    ['Единицы информации', 'Сколько байт в 1 килобайте (в двоичной системе)?', ['1024', '1000', '512', '8'], 0, '1 КБ = 2¹⁰ = 1024 байта.'],
]);

/* ─────────────── TURIZMDA AKT — o'zbekcha ─────────────── */
export const IT_TOUR_UZ = build([
    ['Bron qilish tizimlari', 'Aviachipta va mehmonxonalarni bron qilishning global tarqatish tizimi qisqartmasi?', ['GDS', 'GPS', 'CRM', 'SEO'], 0, 'GDS — Global Distribution System.'],
    ['Bron qilish tizimlari', 'Quyidagilardan qaysi biri GDS tizimi?', ['Amadeus', 'Excel', 'Telegram', 'Photoshop'], 0, 'Amadeus, Sabre, Galileo — eng yirik GDS tizimlari.'],
    ['Bron qilish tizimlari', 'Booking.com va Expedia kabi onlayn sayyohlik agentliklari qanday ataladi?', ['OTA', 'ERP', 'LAN', 'ISP'], 0, 'OTA — Online Travel Agency.'],
    ['Mehmonxona tizimlari', 'Mehmonxonada xonalar, bron va check-in/check-out jarayonlarini boshqaruvchi dastur?', ['PMS', 'CMS', 'GDS', 'VPN'], 0, 'PMS — Property Management System.'],
    ['Mehmonxona tizimlari', "Xonalarni bir vaqtda ko'p OTA saytlariga joylab, bo'sh xonalar sonini sinxronlaydigan vosita?", ['Channel manager', 'Antivirus', 'Brauzer', 'Router'], 0, "Channel manager bir xonaning ikki marta sotilishining (overbooking) oldini oladi."],
    ['Mehmonxona tizimlari', "Restoran va barda buyurtma hamda to'lovlarni qayd etuvchi kassa tizimi?", ['POS-tizim', 'GDS', 'OTA', 'DNS'], 0, "POS — Point of Sale (sotuv nuqtasi)."],
    ['Mehmonxona tizimlari', "Narx va bandlikni tahlil qilib, mehmonxona daromadini oshirish?", ['Revenue management', 'Housekeeping', 'Concierge', 'Catering'], 0, "Revenue management — daromadni boshqarish."],
    ['Narxlash', 'Talab va mavsumga qarab narxning avtomatik o\'zgarishi nima deyiladi?', ['Dinamik narxlash', 'Fiksirlangan narx', 'Chegirma kuponi', 'Barter'], 0, 'Aviakompaniya va mehmonxonalar dinamik narxlashdan keng foydalanadi.'],
    ['Onlayn obro\'', 'Sayyohlar mehmonxona va restoranlarga sharh qoldiradigan mashhur sayt?', ['TripAdvisor', 'LinkedIn', 'GitHub', 'Wikipedia'], 0, "TripAdvisor sharhlari mijozlar tanloviga kuchli ta'sir qiladi."],
    ['Elektron hukumat', "O'zbekistonga elektron viza olishning rasmiy sayti?", ['e-visa.gov.uz', 'my.gov.uz', 'soliq.uz', 'stat.uz'], 0, 'e-visa.gov.uz — elektron vizaning rasmiy portali.'],
    ['Raqamli tajriba', 'Sayyohlik obyektini uydan turib 360° ko\'rish imkonini beruvchi texnologiya?', ['Virtual tur (VR)', 'Faks', 'Radio', 'SMS'], 0, "Virtual tur muzey va mehmonxonalarni oldindan ko'rsatadi."],
    ['Raqamli tajriba', "Muzey eksponati yonida turib, telefonda ma'lumot ochadigan kod?", ['QR-kod', 'PIN-kod', 'Morze kodi', 'Pochta indeksi'], 0, 'QR-kodni kamera bilan skanerlab, matn, audio-gid yoki saytni ochish mumkin.'],
    ['Raqamli marketing', 'Saytni Google qidiruvida yuqoriroq chiqarish nima deyiladi?', ['SEO', 'SMM', 'CRM', 'PDF'], 0, 'SEO — Search Engine Optimization.'],
    ['Raqamli marketing', "Ijtimoiy tarmoqlarda turistik xizmatlarni targ'ib qilish?", ['SMM', 'SEO', 'ERP', 'GDS'], 0, 'SMM — Social Media Marketing (Instagram, Telegram, TikTok).'],
    ['Raqamli marketing', 'Reklamani ko\'rganlarning necha foizi uni bosganini ko\'rsatuvchi ko\'rsatkich?', ['CTR', 'GDP', 'VAT', 'CPU'], 0, 'CTR — Click-Through Rate (bosish foizi).'],
    ['Mijozlar bilan ishlash', "Turistik firmaning mijozlar bazasi va ularning sayohat tarixini saqlovchi tizim?", ['CRM', 'PMS', 'GPS', 'LAN'], 0, "CRM qaytib keluvchi mijozlarga shaxsiy taklif berishga yordam beradi."],
    ['Mijozlar bilan ishlash', "Saytda mijozlar savollariga 24/7 avtomatik javob beruvchi dastur?", ['Chat-bot', 'Skaner', 'Printer', 'Firewall'], 0, 'Chat-bot bron va narx haqidagi oddiy savollarga darhol javob beradi.'],
    ['Navigatsiya', 'Sayyoh joylashuvini sun\'iy yo\'ldoshlar orqali aniqlash tizimi?', ['GPS', 'GDS', 'USB', 'HDMI'], 0, 'GPS — Global Positioning System.'],
    ['Navigatsiya', 'Onlayn xarita va marshrut xizmati qaysi?', ['Google Maps', 'Google Docs', 'Gmail', 'Google Sheets'], 0, 'Google Maps — xarita, marshrut va joylar haqidagi sharhlar.'],
    ['Chiptalar', "Qog'oz o'rniga telefonga yuboriladigan chipta?", ['Elektron chipta (e-ticket)', 'Pasport', 'Vaucher daftari', 'Taklifnoma'], 0, 'Elektron chipta yo\'qolmaydi va onlayn tekshiriladi.'],
    ['Xavfsizlik', "Onlayn bron qilishda sayt xavfsizligini ko'rsatuvchi belgi?", ['Manzilda https va qulf belgisi', 'Saytda rangli rasmlar', "Ko'p reklama", 'Katta shrift'], 0, "https — ma'lumotlar shifrlangan holda uzatiladi."],
    ['Xavfsizlik', 'Mehmonxona Wi-Fi tarmog\'ida mehmonlar ma\'lumotini himoya qilish uchun nima kerak?', ['Parol va shifrlash (WPA2/WPA3)', 'Parolsiz ochiq tarmoq', "Routerni o'chirib qo'yish", 'Faqat Bluetooth'], 0, "WPA2/WPA3 shifrlash tarmoqdagi ma'lumotni begonalardan himoya qiladi."],
    ['Elektron tijorat', "Agentlik sayohat paketini (aviabilet + mehmonxona + ekskursiya) mijozga onlayn sotishi qaysi model?", ['B2C', 'C2C', 'G2G', 'C2B'], 0, "B2C — biznes to'g'ridan-to'g'ri mijozga sotadi."],
    ['Texnologiyalar', 'Turizmda Big Data (katta ma\'lumotlar) nimaga yordam beradi?', ["Sayyohlar oqimi va talabni bashorat qilishga", 'Printerni sozlashga', 'Klaviaturani tozalashga', "Fayl nomini o'zgartirishga"], 0, "Katta ma'lumotlar mavsumiy talab va mashhur yo'nalishlarni oldindan ko'rsatadi."],
    ['Texnologiyalar', "Sun'iy intellekt asosidagi, sayyohga xorijda yordam beruvchi tarjimon ilova?", ['Google Translate', 'Paint', 'Kalkulyator', 'Bloknot'], 0, 'Google Translate matn, ovoz va kamera orqali tarjima qiladi.'],
]);

/* ─────────────── ИКТ В ТУРИЗМЕ — русский ─────────────── */
export const IT_TOUR_RU = build([
    ['Системы бронирования', 'Как сокращённо называется глобальная система бронирования авиабилетов и отелей?', ['GDS', 'GPS', 'CRM', 'SEO'], 0, 'GDS — Global Distribution System (глобальная дистрибутивная система).'],
    ['Системы бронирования', 'Что из перечисленного является системой GDS?', ['Amadeus', 'Excel', 'Telegram', 'Photoshop'], 0, 'Amadeus, Sabre, Galileo — крупнейшие GDS.'],
    ['Системы бронирования', 'Как называются онлайн-турагентства вроде Booking.com и Expedia?', ['OTA', 'ERP', 'LAN', 'ISP'], 0, 'OTA — Online Travel Agency.'],
    ['Гостиничные системы', 'Программа, управляющая номерами, бронированием и заселением/выселением в отеле?', ['PMS', 'CMS', 'GDS', 'VPN'], 0, 'PMS — Property Management System.'],
    ['Гостиничные системы', 'Инструмент, который размещает номера сразу на многих OTA и синхронизирует их количество?', ['Channel manager', 'Антивирус', 'Браузер', 'Роутер'], 0, 'Channel manager предотвращает двойную продажу номера (овербукинг).'],
    ['Гостиничные системы', 'Кассовая система для учёта заказов и оплат в ресторане и баре?', ['POS-система', 'GDS', 'OTA', 'DNS'], 0, 'POS — Point of Sale (точка продаж).'],
    ['Гостиничные системы', 'Анализ цен и загрузки для увеличения дохода отеля — это…', ['Revenue management', 'Housekeeping', 'Concierge', 'Catering'], 0, 'Revenue management — управление доходами.'],
    ['Ценообразование', 'Как называется автоматическое изменение цены в зависимости от спроса и сезона?', ['Динамическое ценообразование', 'Фиксированная цена', 'Купон на скидку', 'Бартер'], 0, 'Авиакомпании и отели широко используют динамическое ценообразование.'],
    ['Онлайн-репутация', 'Популярный сайт, где туристы оставляют отзывы об отелях и ресторанах?', ['TripAdvisor', 'LinkedIn', 'GitHub', 'Wikipedia'], 0, 'Отзывы на TripAdvisor сильно влияют на выбор клиентов.'],
    ['Электронное правительство', 'Официальный сайт для получения электронной визы в Узбекистан?', ['e-visa.gov.uz', 'my.gov.uz', 'soliq.uz', 'stat.uz'], 0, 'e-visa.gov.uz — официальный портал электронной визы.'],
    ['Цифровой опыт', 'Технология, позволяющая осмотреть объект на 360° не выходя из дома?', ['Виртуальный тур (VR)', 'Факс', 'Радио', 'SMS'], 0, 'Виртуальный тур заранее показывает музей или отель.'],
    ['Цифровой опыт', 'Код рядом с экспонатом музея, открывающий информацию на телефоне?', ['QR-код', 'PIN-код', 'Азбука Морзе', 'Почтовый индекс'], 0, 'QR-код сканируют камерой и открывают текст, аудиогид или сайт.'],
    ['Цифровой маркетинг', 'Как называется продвижение сайта на верхние позиции в поиске Google?', ['SEO', 'SMM', 'CRM', 'PDF'], 0, 'SEO — Search Engine Optimization (поисковая оптимизация).'],
    ['Цифровой маркетинг', 'Продвижение туристических услуг в социальных сетях — это…', ['SMM', 'SEO', 'ERP', 'GDS'], 0, 'SMM — Social Media Marketing (Instagram, Telegram, TikTok).'],
    ['Цифровой маркетинг', 'Показатель: какой процент увидевших рекламу нажал на неё?', ['CTR', 'GDP', 'VAT', 'CPU'], 0, 'CTR — Click-Through Rate (кликабельность).'],
    ['Работа с клиентами', 'Система, хранящая базу клиентов турфирмы и историю их поездок?', ['CRM', 'PMS', 'GPS', 'LAN'], 0, 'CRM помогает делать персональные предложения постоянным клиентам.'],
    ['Работа с клиентами', 'Программа на сайте, автоматически отвечающая клиентам 24/7?', ['Чат-бот', 'Сканер', 'Принтер', 'Брандмауэр'], 0, 'Чат-бот сразу отвечает на простые вопросы о бронировании и ценах.'],
    ['Навигация', 'Система определения местоположения туриста по спутникам?', ['GPS', 'GDS', 'USB', 'HDMI'], 0, 'GPS — Global Positioning System.'],
    ['Навигация', 'Какой сервис даёт онлайн-карты и маршруты?', ['Google Maps', 'Google Docs', 'Gmail', 'Google Sheets'], 0, 'Google Maps — карты, маршруты и отзывы о местах.'],
    ['Билеты', 'Билет, который приходит на телефон вместо бумажного?', ['Электронный билет (e-ticket)', 'Паспорт', 'Книжка ваучеров', 'Приглашение'], 0, 'Электронный билет не теряется и проверяется онлайн.'],
    ['Безопасность', 'Признак безопасного сайта при онлайн-бронировании?', ['https и значок замка в адресе', 'Яркие картинки на сайте', 'Много рекламы', 'Крупный шрифт'], 0, 'https — данные передаются в зашифрованном виде.'],
    ['Безопасность', 'Что нужно для защиты данных гостей в Wi-Fi сети отеля?', ['Пароль и шифрование (WPA2/WPA3)', 'Открытая сеть без пароля', 'Выключить роутер', 'Только Bluetooth'], 0, 'Шифрование WPA2/WPA3 защищает данные в сети от посторонних.'],
    ['Электронная коммерция', 'Турагентство продаёт клиенту онлайн пакет (авиабилет + отель + экскурсия). Какая это модель?', ['B2C', 'C2C', 'G2G', 'C2B'], 0, 'B2C — бизнес продаёт напрямую клиенту.'],
    ['Технологии', 'Чем Big Data (большие данные) помогает туризму?', ['Прогнозировать турпотоки и спрос', 'Настраивать принтер', 'Чистить клавиатуру', 'Переименовывать файлы'], 0, 'Большие данные заранее показывают сезонный спрос и популярные направления.'],
    ['Технологии', 'Приложение-переводчик на основе ИИ, помогающее туристу за границей?', ['Google Translate', 'Paint', 'Калькулятор', 'Блокнот'], 0, 'Google Translate переводит текст, голос и изображение с камеры.'],
]);

const LANG_NAMES: Record<string, string> = { uz: "o'zbek", ru: 'rus' };

/** Tashqi AI'da savol tayyorlatish uchun prompt (savollar tanlangan tilda). */
export const IT_PROMPT = (topic: string, count: number, lang: string) => `Universitet talabalari uchun "Axborot texnologiyalari" fanidan "${topic}" mavzusida ${count} ta test savoli tuz. Savollar, variantlar va izohlar ${LANG_NAMES[lang] ?? "o'zbek"} tilida bo'lsin.
Har bir savolda aynan 4 ta variant, faqat bittasi to'g'ri. Savollar amaliy va tushunarli bo'lsin.
Javobni FAQAT JSON massiv ko'rinishida, boshqa hech qanday matnsiz qaytar:
[
  { "topic": "Excel", "q": "Savol matni?", "options": ["A", "B", "C", "D"], "answer": "B", "explain": "Qisqa izoh (1 gap)." }
]
Qoidalar: "answer" variantlardan biri bilan aynan bir xil bo'lsin; to'g'ri javoblar variantlar orasida aralash joylashsin; javoblar 100% to'g'ri ekanini tekshir.`;
