import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Zukkoo — Real-vaqt Ta\'lim Platformasi',
    description: 'TUIT ATT bo\'limi uchun real-vaqt interaktiv viktorina platformasi. Kahoot analogi — Zukkoo.uz',
    keywords: 'zukkoo, tuit, att, viktorina, quiz, realtime, gamification',
    icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="uz">
            <body>{children}</body>
        </html>
    );
}
