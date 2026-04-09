import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 10.0.2.2 is the localhost alias for Android emulators
const API_URL = 'http://10.0.2.2:3000/api';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
            return;
        }
        setLoading(true);

        try {
            // Emulyatorda qotib qolmasligi uchun Timeout (5 soniya)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`${API_URL}/mobile/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await res.json().catch(() => null);

            if (!res.ok) throw new Error(data?.error || 'Tarmoq yoki server xatosi yuz berdi');

            await AsyncStorage.setItem('userToken', data.token);
            if (data.user) await AsyncStorage.setItem('userData', JSON.stringify(data.user));

            navigation.replace('Main');
        } catch (e: any) {
            if (e.name === 'AbortError') {
                Alert.alert("Tarmoq xatosi", "Serverga ulanib bo'lmadi. Dasturchi serveringiz yoniqmi?");
            } else {
                Alert.alert("Kirish xatosi", e.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>ZukkoMobile</Text>
            <Text style={styles.subtitle}>Tizimga kirish</Text>

            <TextInput
                style={styles.input}
                placeholder="O'qituvchi elektron pochtasi"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Parol"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Kirish</Text>
                )}
            </TouchableOpacity>

            <View style={styles.linkContainer}>
                <Text style={styles.linkText}>Hali profilingiz yo'qmi? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkAction}>Ro'yxatdan o'tish</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.guestButton} onPress={() => navigation.replace('Main')}>
                <Text style={styles.guestButtonText}>Mehmon sifatida davom etish</Text>
            </TouchableOpacity>
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
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: '#ffffff',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginBottom: 40,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 18,
        color: 'white',
        fontSize: 16,
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#3b82f6',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    linkText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
    },
    linkAction: {
        color: '#3b82f6',
        fontSize: 15,
        fontWeight: 'bold',
    },
    guestButton: {
        marginTop: 40,
        alignItems: 'center',
    },
    guestButtonText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        textDecorationLine: 'underline',
    }
});
