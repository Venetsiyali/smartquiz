import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://192.168.1.100:3000/api';

export default function PinScreen({ navigation }: any) {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (pin.length < 6) {
            Alert.alert("Xatolik", "PIN kod 6 ta raqamdan iborat bo'lishi kerak");
            return;
        }

        setLoading(true);
        try {
            // MOCK verification using Next.js backend logic placeholder
            /*
            const res = await fetch(`${API_URL}/game/verify-pin`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pin })
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.error);
            */

            // Navigate to wait room upon successful PIN validation
            setTimeout(() => {
                setLoading(false);
                navigation.replace('WaitingRoom', { pin });
            }, 1000);

        } catch (e: any) {
            Alert.alert("Xatolik", e.message || "Ulanishda xatolik yuz berdi");
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <Text style={styles.title}>O'yinga qo'shilish</Text>
            <Text style={styles.subtitle}>Ekranda ko'rsatilgan 6 xonali PIN kodni kiriting</Text>

            <TextInput
                style={styles.input}
                placeholder="PIN KOD"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="number-pad"
                maxLength={6}
                value={pin}
                onChangeText={setPin}
                textAlign="center"
            />

            <TouchableOpacity
                style={[styles.button, pin.length === 6 ? styles.btnActive : styles.btnDisabled]}
                onPress={handleJoin}
                disabled={loading || pin.length < 6}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>KIRISh</Text>
                )}
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
    backBtn: {
        position: 'absolute',
        top: 60,
        left: 20,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginBottom: 40,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        padding: 20,
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 8,
        marginBottom: 24,
    },
    button: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    btnActive: {
        backgroundColor: '#3b82f6',
    },
    btnDisabled: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
