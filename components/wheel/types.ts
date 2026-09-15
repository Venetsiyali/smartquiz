export interface WheelPlayerData {
    id: string;
    name: string;
    score: number;
    correctCount: number;
    wrongCount: number;
}

export interface WheelQuestionPreview {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    source: 'AI' | 'FILE' | 'MANUAL';
    used: boolean;
}

/** AI/fayldan qaytgan, hali sessiyaga saqlanmagan xom savol. */
export interface DraftQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    source: 'AI' | 'FILE' | 'MANUAL';
}
