// Settings sahifasi — foydalanuvchi shaxsiy sahifasi — NOINDEX
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sozlamalar | Zukkoo.uz',
    robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
    },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
