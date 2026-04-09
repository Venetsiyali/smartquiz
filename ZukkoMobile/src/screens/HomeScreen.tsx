import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

export default function HomeScreen({ navigation }: any) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Lobby</Text>
                <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.profileTxt}>Chiqish</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🎮 PIN orqali ulanish</Text>
                    <Text style={styles.cardSub}>O'qituvchi bergan 6 xonali kodni kiriting</Text>
                    <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={() => navigation.navigate('Pin')}
                    >
                        <Text style={styles.btnTxt}>O'yinga qo'shilish</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.cardDark}>
                    <Text style={styles.cardTitle}>🎲 Mening O'yinlarim</Text>
                    <Text style={styles.cardSub}>Siz yaratgan barcha viktorinalar</Text>
                    <TouchableOpacity style={styles.btnSecondary}>
                        <Text style={styles.btnTxt}>Ro'yxatni ko'rish</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
    },
    profileBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    profileTxt: {
        color: 'white',
        fontWeight: 'bold',
    },
    scroll: {
        padding: 20,
        gap: 16,
    },
    card: {
        backgroundColor: '#1e293b', // slate-800
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardDark: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: 'white',
        marginBottom: 4,
    },
    cardSub: {
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 20,
    },
    btnPrimary: {
        backgroundColor: '#10b981', // emerald-500
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    btnSecondary: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    btnTxt: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
