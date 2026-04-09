import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function GamePlayScreen({ route, navigation }: any) {
    const { pin } = route.params;
    const [vibrationEnabled, setVibrationEnabled] = useState(true);

    // Game state
    const [question, setQuestion] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(20);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        loadSettings();
        // Simulate receiving the first question
        setTimeout(() => {
            setQuestion({
                text: "Kompakt disk (CD) qancha ma'lumot sig'imiga ega bo'lgan?",
                options: ["1.44 MB", "700 MB", "4.7 GB", "128 KB"],
                correctIndex: 1
            });
        }, 1500);
    }, []);

    useEffect(() => {
        let timer: any;
        if (question && timeLeft > 0 && !isRevealed) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
                if (vibrationEnabled && timeLeft <= 5) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                }
            }, 1000);
        } else if (timeLeft === 0 && !isRevealed) {
            handleTimeUp();
        }
        return () => clearInterval(timer);
    }, [timeLeft, question, isRevealed, vibrationEnabled]);

    const loadSettings = async () => {
        const v = await AsyncStorage.getItem('vibrationEnabled');
        if (v !== null) setVibrationEnabled(v === 'true');
    };

    const playHaptic = (type: 'success' | 'error' | 'light') => {
        if (!vibrationEnabled) return;
        if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleAnswer = (index: number) => {
        if (isRevealed) return;
        playHaptic('light');
        setSelectedAnswer(index);
        setIsRevealed(true);

        // Evaluate
        if (index === question.correctIndex) {
            playHaptic('success');
        } else {
            playHaptic('error');
        }

        // Move to next question or show leaderboard
        setTimeout(() => {
            navigation.replace('Leaderboard');
        }, 2000);
    };

    const handleTimeUp = () => {
        setIsRevealed(true);
        playHaptic('error');
        Alert.alert("Vaqt tugadi!", "Natijalar ekraniga o'tilmoqda");
        setTimeout(() => {
            navigation.replace('Leaderboard');
        }, 2000);
    };

    if (!question) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingTxt}>Savol yuklanmoqda...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="time-outline" size={28} color={timeLeft <= 5 ? "#ef4444" : "white"} />
                <Text style={[styles.timer, timeLeft <= 5 && { color: '#ef4444' }]}>
                    {timeLeft}s
                </Text>
            </View>

            <View style={styles.questionCard}>
                <Text style={styles.questionText}>{question.text}</Text>
            </View>

            <View style={styles.optionsGrid}>
                {question.options.map((opt: string, i: number) => {
                    let bgColor = 'rgba(255,255,255,0.05)';
                    let borderColor = 'rgba(255,255,255,0.1)';

                    if (isRevealed) {
                        if (i === question.correctIndex) {
                            bgColor = 'rgba(16, 185, 129, 0.2)'; // Correct (green)
                            borderColor = '#10b981';
                        } else if (i === selectedAnswer) {
                            bgColor = 'rgba(239, 68, 68, 0.2)'; // Wrong selection (red)
                            borderColor = '#ef4444';
                        } else {
                            // Fade out others
                            bgColor = 'transparent';
                            borderColor = 'rgba(255,255,255,0.05)';
                        }
                    } else if (i === selectedAnswer) {
                        bgColor = 'rgba(59, 130, 246, 0.2)'; // Selected (blue)
                        borderColor = '#3b82f6';
                    }

                    return (
                        <TouchableOpacity
                            key={i}
                            style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
                            onPress={() => handleAnswer(i)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.optionText}>{opt}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
        padding: 24,
        paddingTop: 60,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#09090b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingTxt: {
        color: 'white',
        marginTop: 16,
        fontSize: 18,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 20,
        alignSelf: 'center',
    },
    timer: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        marginLeft: 8,
    },
    questionCard: {
        backgroundColor: '#1e293b',
        padding: 30,
        borderRadius: 24,
        minHeight: 200,
        justifyContent: 'center',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    questionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        lineHeight: 34,
    },
    optionsGrid: {
        flex: 1,
        gap: 16,
    },
    optionBtn: {
        borderWidth: 2,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
    },
    optionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    }
});
