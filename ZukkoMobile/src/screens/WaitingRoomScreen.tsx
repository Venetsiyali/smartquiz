import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { Pusher } from '@pusher/pusher-websocket-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WaitingRoomScreen({ route, navigation }: any) {
    const { pin } = route.params;
    const [status, setStatus] = useState('Ulanmoqda...');
    const [players, setPlayers] = useState<string[]>([]);

    useEffect(() => {
        const pusher = Pusher.getInstance();

        const connectPusher = async () => {
            try {
                const user = await AsyncStorage.getItem('userData');
                let userName = 'O\'yinchi';
                if (user) {
                    const parsed = JSON.parse(user);
                    userName = parsed.name || parsed.email;
                }

                // Initialize Pusher. Update app key/cluster in production
                await pusher.init({
                    apiKey: "1f8e6c7159aa4b7cb6bb", // Use the valid SmartQuiz key from server env
                    cluster: "ap2"
                });

                await pusher.connect();

                // Listen to game channel using the generated PIN
                const myChannel = await pusher.subscribe({
                    channelName: `presence-game-${pin}`,
                    onEvent: (event: any) => {
                        console.log(`Event in ${pin}: ${event.eventName}`, event);
                        if (event.eventName === 'game-started') {
                            navigation.replace('GamePlay', { pin });
                        } else if (event.eventName === 'player-joined') {
                            // Extract data from event.data payload
                            const data = JSON.parse(event.data);
                            setPlayers(prev => [...prev, data.name]);
                        }
                    },
                    onSubscriptionSucceeded: () => {
                        setStatus(`Kutish zalida (${pin})`);
                        // We can trigger an API route here: /api/game/join
                        setPlayers([userName]);
                    }
                });

            } catch (e: any) {
                setStatus('Ulanishda xatolik yuz berdi');
            }
        };

        connectPusher();

        // Cleanup watcher on unmount
        return () => {
            pusher.unsubscribe({ channelName: `presence-game-${pin}` });
            pusher.disconnect();
        };
    }, [pin]);

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <ActivityIndicator size="large" color="#10b981" style={{ marginBottom: 20 }} />
                <Text style={styles.title}>{status}</Text>
                <Text style={styles.subtitle}>Boshqa o'yinchilar kutilmoqda...</Text>

                {players.length > 0 && (
                    <View style={styles.playersList}>
                        <Text style={styles.playersTitle}>Ulanganlar ({players.length}):</Text>
                        {players.map((p, idx) => (
                            <Text key={idx} style={styles.playerName}>• {p}</Text>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
        padding: 24,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
    },
    playersList: {
        marginTop: 30,
        width: '100%',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 16,
        borderRadius: 12,
    },
    playersTitle: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    playerName: {
        color: '#10b981',
        fontWeight: 'bold',
        fontSize: 16,
        marginVertical: 4,
    }
});
