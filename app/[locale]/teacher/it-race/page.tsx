'use client';

import QuizRaceCreator from '@/components/code-race/QuizRaceCreator';
import { IT_ECON_RU, IT_ECON_UZ, IT_PROMPT, IT_TOUR_RU, IT_TOUR_UZ } from '@/lib/itRaceSamples';

export default function ItRaceCreatePage() {
    return (
        <QuizRaceCreator
            kicker="Iqtisodiyot va turizm yo'nalishlari uchun"
            heading="💼 AKT Poygasi"
            description="Axborot texnologiyalari fanidan jonli poyga: har bir to'g'ri javob — finishga bir qadam. Yo'nalish va tilni tanlang, savollarni tahrirlang yoki AI orqali yangilarini qo'shing."
            theme="it"
            sampleSets={[
                { id: 'econ-uz', label: "📊 Iqtisodiyot · O'zbekcha", title: 'Iqtisodiyotda AKT', questions: IT_ECON_UZ },
                { id: 'econ-ru', label: '📊 Экономика · Русский', title: 'ИКТ в экономике', questions: IT_ECON_RU },
                { id: 'tour-uz', label: "✈️ Turizm · O'zbekcha", title: 'Turizmda AKT', questions: IT_TOUR_UZ },
                { id: 'tour-ru', label: '✈️ Туризм · Русский', title: 'ИКТ в туризме', questions: IT_TOUR_RU },
            ]}
            buildPrompt={IT_PROMPT}
            promptLangs={[{ id: 'uz', label: "O'zbekcha" }, { id: 'ru', label: 'Русский' }]}
            defaultTopic="Excel: formulalar va diagrammalar"
            gradient="linear-gradient(135deg,#f59e0b,#d97706)"
            defaultGoal={10}
        />
    );
}
