'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import SetupNames from '@/components/wheel/SetupNames';
import QuestionSourcePicker from '@/components/wheel/QuestionSourcePicker';
import QuestionPreviewList from '@/components/wheel/QuestionPreviewList';
import Wheel from '@/components/wheel/Wheel';
import TurnModal from '@/components/wheel/TurnModal';
import QuestionCard from '@/components/wheel/QuestionCard';
import AnswerFeedback from '@/components/wheel/AnswerFeedback';
import ResultsScreen from '@/components/wheel/ResultsScreen';
import type { DraftQuestion, WheelPlayerData } from '@/components/wheel/types';

type Step = 'names' | 'source' | 'game' | 'results';
type GamePhase = 'wheel' | 'turn' | 'question' | 'feedback' | 'no-more-questions';

interface CurrentQuestion { id: string; question: string; options: string[]; }
interface AnswerResult { isCorrect: boolean; correctIndex: number; explanation: string; selectedIndex: number; }

export default function WheelGamePage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('names');
    const [error, setError] = useState<string | null>(null);

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [players, setPlayers] = useState<WheelPlayerData[]>([]);
    const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
    const [starting, setStarting] = useState(false);

    const [gamePhase, setGamePhase] = useState<GamePhase>('wheel');
    const [currentPlayer, setCurrentPlayer] = useState<WheelPlayerData | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
    const [submittingAnswer, setSubmittingAnswer] = useState(false);

    const handleAuthError = (status: number) => {
        if (status === 401) {
            setError("Davom etish uchun tizimga kiring.");
            return true;
        }
        return false;
    };

    const handleNamesContinue = async (names: string[]) => {
        setError(null);
        try {
            const sessionRes = await fetch('/api/wheel/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const sessionData = await sessionRes.json();
            if (!sessionRes.ok) {
                if (handleAuthError(sessionRes.status)) return;
                throw new Error(sessionData.error || 'Sessiya yaratilmadi');
            }

            const playersRes = await fetch('/api/wheel/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sessionData.session.id, names }),
            });
            const playersData = await playersRes.json();
            if (!playersRes.ok) throw new Error(playersData.error || "O'quvchilar saqlanmadi");

            setSessionId(sessionData.session.id);
            setPlayers(playersData.players);
            setStep('source');
        } catch (err: any) {
            setError(err.message || 'Xatolik yuz berdi');
        }
    };

    const handleAddDrafts = (qs: DraftQuestion[]) => {
        setDraftQuestions(prev => [...prev, ...qs]);
    };

    const handleRemoveDraft = (idx: number) => {
        setDraftQuestions(prev => prev.filter((_, i) => i !== idx));
    };

    const handleStartGame = async () => {
        if (!sessionId) return;
        setStarting(true);
        setError(null);
        try {
            const res = await fetch('/api/wheel/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, questions: draftQuestions }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Savollar saqlanmadi');
            setDraftQuestions([]);
            setStep('game');
            setGamePhase('wheel');
        } catch (err: any) {
            setError(err.message || 'Xatolik yuz berdi');
        } finally {
            setStarting(false);
        }
    };

    const handleWinner = (player: WheelPlayerData) => {
        setCurrentPlayer(player);
        setGamePhase('turn');
    };

    const drawNextQuestion = useCallback(async () => {
        if (!sessionId) return;
        setError(null);
        try {
            const res = await fetch('/api/wheel/questions/next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Savol olinmadi');
            if (data.done) {
                setGamePhase('no-more-questions');
                return;
            }
            setCurrentQuestion(data.question);
            setGamePhase('question');
        } catch (err: any) {
            setError(err.message || 'Xatolik yuz berdi');
            setGamePhase('wheel');
        }
    }, [sessionId]);

    const handleSubmitAnswer = async (selectedIndex: number) => {
        if (!currentQuestion || !currentPlayer) return;
        setSubmittingAnswer(true);
        setError(null);
        try {
            const res = await fetch('/api/wheel/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionId: currentQuestion.id, playerId: currentPlayer.id, selectedIndex }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Javob tekshirilmadi');

            setPlayers(prev => prev.map(p => (p.id === data.player.id ? data.player : p)));
            setAnswerResult({ isCorrect: data.isCorrect, correctIndex: data.correctIndex, explanation: data.explanation, selectedIndex });
            setGamePhase('feedback');
        } catch (err: any) {
            setError(err.message || 'Xatolik yuz berdi');
        } finally {
            setSubmittingAnswer(false);
        }
    };

    const handleContinueAfterFeedback = () => {
        setCurrentQuestion(null);
        setAnswerResult(null);
        setGamePhase('wheel');
    };

    const handleEndGame = async () => {
        if (sessionId) {
            try {
                await fetch('/api/wheel/session', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, status: 'ended' }),
                });
            } catch {}
        }
        setStep('results');
    };

    const handleNewGame = () => {
        setSessionId(null);
        setPlayers([]);
        setDraftQuestions([]);
        setCurrentPlayer(null);
        setCurrentQuestion(null);
        setAnswerResult(null);
        setError(null);
        setStep('names');
    };

    if (error) {
        return (
            <div className="min-h-screen bg-zukkoo-dark flex items-center justify-center p-6">
                <div className="glass rounded-3xl p-8 text-center max-w-md">
                    <p className="text-red-300 font-bold text-lg mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setError(null)} className="btn-primary px-6 py-2.5">Yopish</button>
                        {error.includes('tizimga kiring') && (
                            <button onClick={() => router.push('/login')} className="btn-primary px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500">
                                Kirish
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'names') {
        return <SetupNames onContinue={handleNamesContinue} />;
    }

    if (step === 'source') {
        return (
            <div className="min-h-screen bg-zukkoo-dark p-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-black text-white mb-1">📋 Savollarni tayyorlash</h1>
                    <p className="text-white/50 font-bold mb-6">{players.length} ta o&apos;quvchi ro&apos;yxatga olindi</p>
                    <div className="space-y-6">
                        <QuestionSourcePicker onAdd={handleAddDrafts} />
                        <QuestionPreviewList
                            questions={draftQuestions}
                            onRemove={handleRemoveDraft}
                            onStart={handleStartGame}
                            starting={starting}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'game') {
        return (
            <div className="min-h-screen bg-zukkoo-dark">
                <div className="flex items-center justify-between px-6 py-4 bg-black/30 border-b border-white/10">
                    <span className="text-white font-black text-xl">🎡 Bilimlar g&apos;ildiragi</span>
                    <button onClick={handleEndGame} className="bg-red-600/80 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl">
                        🏁 O&apos;yinni yakunlash
                    </button>
                </div>

                {gamePhase === 'wheel' && (
                    <div className="flex items-center justify-center py-16">
                        <Wheel players={players} onWinner={handleWinner} disabled={false} />
                    </div>
                )}

                {gamePhase === 'turn' && currentPlayer && (
                    <TurnModal name={currentPlayer.name} onDone={drawNextQuestion} />
                )}

                {gamePhase === 'question' && currentQuestion && currentPlayer && (
                    <QuestionCard
                        playerName={currentPlayer.name}
                        question={currentQuestion.question}
                        options={currentQuestion.options}
                        onSubmit={handleSubmitAnswer}
                        submitting={submittingAnswer}
                    />
                )}

                {gamePhase === 'feedback' && answerResult && currentQuestion && (
                    <AnswerFeedback
                        isCorrect={answerResult.isCorrect}
                        options={currentQuestion.options}
                        correctIndex={answerResult.correctIndex}
                        selectedIndex={answerResult.selectedIndex}
                        explanation={answerResult.explanation}
                        onContinue={handleContinueAfterFeedback}
                    />
                )}

                {gamePhase === 'no-more-questions' && (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-white font-black text-2xl mb-2">Savollar tugadi</p>
                        <p className="text-white/50 font-semibold mb-8">Yangi savol qo&apos;shing yoki o&apos;yinni yakunlang</p>
                        <div className="flex gap-4">
                            <button onClick={() => setStep('source')} className="btn-primary px-6 py-3">➕ Savol qo&apos;shish</button>
                            <button onClick={handleEndGame} className="btn-primary px-6 py-3 bg-red-600 hover:bg-red-500">🏁 Yakunlash</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return <ResultsScreen players={players} onFinish={handleNewGame} />;
}
