import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LeaderboardScreen({ route, navigation }: any) {
    // Mock data for leaderboard
    const players = [
        { id: 1, name: 'Sardor', score: 4500, correct: 5 },
        { id: 2, name: 'Madina', score: 3200, correct: 4 },
        { id: 3, name: 'Anvar', score: 2100, correct: 3 },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="trophy" size={64} color="#facc15" style={{ marginBottom: 16 }} />
                <Text style={styles.title}>Natijalar</Text>
                <Text style={styles.subtitle}>O'yin o'z nihoyasiga yetdi</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {players.map((p, index) => (
                    <View key={p.id} style={[styles.playerCard, index === 0 && styles.firstPlace]}>
                        <View style={styles.rankBadge}>
                            <Text style={styles.rankTxt}>{index + 1}</Text>
                        </View>
                        <View style={styles.playerInfo}>
                            <Text style={styles.playerName}>{p.name}</Text>
                            <Text style={styles.playerStats}>{p.correct} ta to'g'ri</Text>
                        </View>
                        <Text style={styles.playerScore}>{p.score}</Text>
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => navigation.replace('Main')}
            >
                <Text style={styles.btnTxt}>Bosh sahifaga qaytish</Text>
            </TouchableOpacity>
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
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: 'white',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
    },
    scroll: {
        gap: 12,
        paddingBottom: 40,
    },
    playerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
    },
    firstPlace: {
        backgroundColor: 'rgba(250, 204, 21, 0.1)',
        borderColor: 'rgba(250, 204, 21, 0.3)',
    },
    rankBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rankTxt: {
        color: 'white',
        fontWeight: '900',
        fontSize: 18,
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    playerStats: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    playerScore: {
        color: '#10b981',
        fontSize: 24,
        fontWeight: '900',
    },
    btnPrimary: {
        backgroundColor: '#3b82f6',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    btnTxt: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
