'use client';

import QuizRaceCreator from '@/components/code-race/QuizRaceCreator';
import { ENG_PROMPT, SAMPLE_ENG } from '@/lib/engRaceSamples';

export default function EngRaceCreatePage() {
    return (
        <QuizRaceCreator
            kicker="Ingliz tili grammatikasi poygasi"
            heading="🏁 Grammar Race"
            description="Har bir to'g'ri javob talabani finishga bir qadam yaqinlashtiradi. Xato javobda to'g'risi va qisqa izoh ko'rsatiladi. Kim birinchi finishga yetsa — g'olib!"
            theme="grammar"
            sampleSets={[{ id: 'b1', label: 'Namuna: B1 grammatika', title: 'Grammar Race — B1', questions: SAMPLE_ENG }]}
            buildPrompt={(topic, count) => ENG_PROMPT(topic, count)}
            defaultTopic="Present Perfect vs Past Simple"
        />
    );
}
