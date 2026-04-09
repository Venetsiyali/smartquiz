import React, { useRef, useState } from 'react';
import { View, ActivityIndicator, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

// Bu yerdagi manzil asosiy Vebsahifangiz havolasidir.
// O'zgartirmoqchi bo'lsangiz kelajakda shuni o'zgartirasiz.
// Local test qilish uchun 'http://10.0.2.2:3000' (faqat dev/emulatorda) yoziladi.
const PLATFORM_URL = 'https://zukkoo.uz'; 

export default function App() {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b', paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 }}>
      {/* Veb qoplamasini yuklayotganda yuklanish jarayonini aniq ko'rsatish */}
      {loading && (
        <View style={{ flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: PLATFORM_URL }}
        style={{ flex: 1, display: loading ? 'none' : 'flex' }}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
      
      {/* Status Bar Rangi */}
      <StatusBar style="light" backgroundColor="#09090b" />
    </SafeAreaView>
  );
}
