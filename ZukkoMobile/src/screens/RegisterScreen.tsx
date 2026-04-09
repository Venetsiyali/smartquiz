import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:3000/api';

export default function RegisterScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
            return;
        }
        setLoading(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`${API_URL}/mobile/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await res.json().catch(() => null);

            if (!res.ok) throw new Error(data?.error || 'Tarmoq yoki server xatosi yuz berdi');

            if (data?.token) {
                await AsyncStorage.setItem('userToken', data.token);
                if (data.user) await AsyncStorage.setItem('userData', JSON.stringify(data.user));
            }
            
            Alert.alert("Muvaffaqiyatli", "Ro'yxatdan o'tdingiz!");
            navigation.replace('Main');
        } catch (e: any) {
            if (e.name === 'AbortError') {
                Alert.alert("Tarmoq xatosi", "Serverga ulanib bo'lmadi. Dasturchi serveringiz yoniqmi?");
            } else {
                Alert.alert("Ro'yxatdan o'tish xatosi", e.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>ZukkoMobile</Text>
            <Text style={styles.subtitle}>Yangi profil yaratish</Text>

            <TextInput
                style={styles.input}
                placeholder="Ism va familiya"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={name}
                onChangeText={setName}
            />
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
                placeholder="Yangi parol tuzing"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Ro'yxatdan o'tish</Text>
                )}
            </TouchableOpacity>

            <View style={styles.linkContainer}>
                <Text style={styles.linkText}>Profilingiz bormi? </Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.linkAction}>Kirish</Text>
                </TouchableOpacity>
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
        backgroundColor: '#10b981', // Green for register
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
    }
});
