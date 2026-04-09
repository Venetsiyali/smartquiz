import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://192.168.1.100:3000/api';

export default function QuizzesScreen() {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            // In production, we assume endpoint "/api/mobile/quizzes" expects "Authorization: Bearer Token"
            // or similar proxy for Zukkoo quizzes returning user's active game templates.
            // Below is the layout for the API integration request structure.
            /*
            const res = await fetch(`${API_URL}/mobile/quizzes`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if(data.quizzes) setQuizzes(data.quizzes);
            */

            // MOCK DATA for local representation until real API logic is fetched
            setTimeout(() => {
                setQuizzes([
                    { id: '1', title: 'Fizika: Optika asoslari', questionsCount: 12, mode: 'blitz' },
                    { id: '2', title: 'IT atamalari', questionsCount: 20, mode: 'classic' },
                ]);
                setLoading(false);
            }, 1000);

        } catch (e: any) {
            Alert.alert("Xatolik", "Quizlarni yuklashda xatolik");
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Viktorinalar</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#3b82f6" />
            ) : quizzes.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="folder-open-outline" size={48} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTxt}>Hozircha viktorinalar yo'q</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {quizzes.map((q) => (
                        <TouchableOpacity key={q.id} style={styles.card}>
                            <View>
                                <Text style={styles.cardTitle}>{q.title}</Text>
                                <Text style={styles.cardSub}>{q.questionsCount} ta savol • {q.mode}</Text>
                            </View>
                            <Ionicons name="play-circle" size={42} color="#10b981" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
        padding: 24,
        paddingTop: 80,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
        marginBottom: 20,
    },
    scroll: {
        gap: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    cardSub: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
    },
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    emptyTxt: {
        color: 'rgba(255,255,255,0.3)',
        fontWeight: 'bold',
    }
});
