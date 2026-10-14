// Poyga o'yinlari (Grammar Race, AKT Poygasi, Kod Cho'qqisi) interfeysi uchun o'zbekcha/ruscha matnlar.
// O'yin tili savollar to'plamiga qarab belgilanadi (race.uiLang) — rus guruhlari uchun ekranlar ruscha bo'ladi.

export type RaceLang = 'uz' | 'ru';

const UZ = {
    // umumiy
    loading: '⏳ Yuklanmoqda...',
    players: "O'yinchilar",
    rank: "O'rningiz",
    minutes: 'daqiqa',
    // o'qituvchi ekrani
    finishGoal: "Finish — {n} ta to'g'ri javob",
    tasksCount: '{n} ta masala',
    openOnDevice: 'Telefoningiz yoki noutbukingizda oching:',
    start: '🚀 Boshlash',
    joined: "Qo'shilganlar ({n})",
    waitingStudents: 'Talabalar kutilmoqda...',
    endGame: '⏹ Yakunlash',
    ranking: '🏆 Reyting',
    raceOver: '🏁 Musobaqa yakunlandi!',
    feedSolved: "⚡ {name} — {n} ta to'g'ri javob",
    feedFinished: '🏁 {name} finishga yetdi!',
    onlyHost: "Bu o'yinni faqat uni yaratgan o'qituvchi boshqara oladi",
    // talaba
    joinTitle: "Musobaqaga qo'shilish",
    yourName: 'Ismingiz',
    join: "🚀 Qo'shilish",
    waitTeacher: "O'qituvchi boshlashini kuting",
    lobbyHint: "Har bir to'g'ri javob sizni finishga bir qadam yaqinlashtiradi. {n} ta to'g'ri javob — finish!",
    finishedTitle: 'Finishga yetdingiz!',
    raceEnded: 'Musobaqa yakunlandi',
    othersRacing: "Boshqalar hali poygada — proyektorni kuzating 👀",
    streak: '🔥 {n} ketma-ket!',
    yourAnswer: 'Sizning javobingiz',
    correctIs: "to'g'risi",
    typeAnswer: 'Javobni yozing...',
    noPin: "PIN ko'rsatilmagan.",
    enterPin: 'PIN kiritish',
};

const RU: typeof UZ = {
    loading: '⏳ Загрузка...',
    players: 'Игроки',
    rank: 'Ваше место',
    minutes: 'мин',
    finishGoal: 'Финиш — {n} правильных ответов',
    tasksCount: '{n} задач',
    openOnDevice: 'Откройте на телефоне или ноутбуке:',
    start: '🚀 Начать',
    joined: 'Подключились ({n})',
    waitingStudents: 'Ожидаем студентов...',
    endGame: '⏹ Завершить',
    ranking: '🏆 Рейтинг',
    raceOver: '🏁 Гонка завершена!',
    feedSolved: '⚡ {name} — {n} правильных ответов',
    feedFinished: '🏁 {name} пришёл к финишу!',
    onlyHost: 'Этой игрой может управлять только создавший её преподаватель',
    joinTitle: 'Присоединиться к гонке',
    yourName: 'Ваше имя',
    join: '🚀 Присоединиться',
    waitTeacher: 'Ждите, пока преподаватель начнёт',
    lobbyHint: 'Каждый правильный ответ — шаг к финишу. {n} правильных ответов — финиш!',
    finishedTitle: 'Вы на финише!',
    raceEnded: 'Гонка завершена',
    othersRacing: 'Остальные ещё в гонке — смотрите на экран 👀',
    streak: '🔥 {n} подряд!',
    yourAnswer: 'Ваш ответ',
    correctIs: 'правильно',
    typeAnswer: 'Введите ответ...',
    noPin: 'PIN не указан.',
    enterPin: 'Ввести PIN',
};

export type RaceKey = keyof typeof UZ;

export function raceT(lang: RaceLang | null | undefined) {
    const dict = lang === 'ru' ? RU : UZ;
    return (key: RaceKey, vars?: Record<string, string | number>) =>
        dict[key].replace(/\{(\w+)\}/g, (_, k) => String(vars?.[k] ?? `{${k}}`));
}
