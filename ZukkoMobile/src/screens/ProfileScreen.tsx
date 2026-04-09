import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }: any) {
    const [user, setUser] = useState<any>(null);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);

    useEffect(() => {
        const loadUserAndSettings = async () => {
            const u = await AsyncStorage.getItem('userData');
            if (u) setUser(JSON.parse(u));
            const v = await AsyncStorage.getItem('vibrationEnabled');
            if (v !== null) setVibrationEnabled(v === 'true');
        };
        loadUserAndSettings();
    }, []);

    const toggleVibration = async (val: boolean) => {
        setVibrationEnabled(val);
        await AsyncStorage.setItem('vibrationEnabled', val.toString());
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        navigation.replace('Login');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mening Profilim</Text>

            {user ? (
                <View style={styles.card}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarTxt}>{user.name?.[0] || 'Z'}</Text>
                    </View>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.email}>{user.email}</Text>

                    <View style={styles.badge}>
                        <Text style={styles.badgeTxt}>{user.role === 'ADMIN' ? 'ADMNISTRATOR' : 'O\'QITUVCHI'}</Text>
                    </View>
                </View>
            ) : (
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
            )}

            <View style={styles.settingsCard}>
                <Text style={styles.settingsTitle}>Sozlamalar</Text>
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>O'yin vaqtida vibratsiya</Text>
                    <Switch
                        value={vibrationEnabled}
                        onValueChange={toggleVibration}
                        trackColor={{ false: '#3f3f46', true: '#10b981' }}
                        thumbColor={'#ffffff'}
                    />
                </View>
            </View>

            <View style={{ flex: 1 }} />

            <Text onPress={handleLogout} style={styles.logoutBtn}>Tizimdan chiqish</Text>
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
        marginBottom: 40,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarTxt: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    email: {
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 16,
    },
    badge: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)', // emerald-500/20
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeTxt: {
        color: '#10b981',
        fontWeight: '900',
        fontSize: 12,
    },
    settingsCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 24,
        marginTop: 24,
    },
    settingsTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
    },
    logoutBtn: {
        color: '#ef4444',
        textAlign: 'center',
        fontWeight: 'bold',
        padding: 20,
        fontSize: 16,
    }
});
