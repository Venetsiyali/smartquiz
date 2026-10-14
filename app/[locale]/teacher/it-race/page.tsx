'use client';

import { useParams } from 'next/navigation';
import QuizRaceCreator, { type SampleSet } from '@/components/code-race/QuizRaceCreator';
import { IT_ECON_RU, IT_ECON_UZ, IT_PROMPT, IT_TOUR_RU, IT_TOUR_RU_NEW, IT_TOUR_UZ } from '@/lib/itRaceSamples';

const TEXT = {
    uz: {
        kicker: "Iqtisodiyot va turizm yo'nalishlari uchun",
        heading: '💼 AKT Poygasi',
        description: "Axborot texnologiyalari fanidan jonli poyga: har bir to'g'ri javob — finishga bir qadam. Yo'nalish va tilni tanlang, savollarni tahrirlang yoki AI orqali yangilarini qo'shing.",
        topic: 'Excel: formulalar va diagrammalar',
    },
    ru: {
        kicker: 'Для направлений «Экономика» и «Туризм»',
        heading: '💼 Гонка ИКТ',
        description: 'Живая гонка по информационным технологиям: каждый правильный ответ — шаг к финишу. Выберите направление и язык, отредактируйте вопросы или добавьте новые через ИИ.',
        topic: 'Excel: формулы и диаграммы',
    },
};

export default function ItRaceCreatePage() {
    const { locale } = useParams<{ locale: string }>();
    const t = TEXT[locale === 'ru' ? 'ru' : 'uz'];
    return (
        <QuizRaceCreator
            kicker={t.kicker}
            heading={t.heading}
            description={t.description}
            theme="it"
            sampleSets={([
                { id: 'econ-uz', label: "📊 Iqtisodiyot · O'zbekcha", title: 'Iqtisodiyotda AKT', questions: IT_ECON_UZ, lang: 'uz' },
                { id: 'econ-ru', label: '📊 Экономика · Русский', title: 'ИКТ в экономике', questions: IT_ECON_RU, lang: 'ru' },
                { id: 'tour-uz', label: "✈️ Turizm · O'zbekcha", title: 'Turizmda AKT', questions: IT_TOUR_UZ, lang: 'uz' },
                { id: 'tour-ru', label: '✈️ Туризм · Русский', title: 'ИКТ в туризме', questions: IT_TOUR_RU, lang: 'ru' },
                { id: 'tour-ru-new', label: '✈️ Туризм · Русский · Новые', title: 'ИКТ в туризме — новые вопросы', questions: IT_TOUR_RU_NEW, lang: 'ru' },
            ] as SampleSet[]).sort((a, b) => (locale === 'ru' ? Number(b.lang === 'ru') - Number(a.lang === 'ru') : 0))}
            buildPrompt={IT_PROMPT}
            promptLangs={locale === 'ru'
                ? [{ id: 'ru', label: 'Русский' }, { id: 'uz', label: "O'zbekcha" }]
                : [{ id: 'uz', label: "O'zbekcha" }, { id: 'ru', label: 'Русский' }]}
            defaultTopic={t.topic}
            gradient="linear-gradient(135deg,#f59e0b,#d97706)"
            defaultGoal={10}
        />
    );
}
