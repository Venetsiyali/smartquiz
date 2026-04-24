// Login sahifasi — NOINDEX (Google indekslamasin)
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Kirish | Zukkoo.uz',
    robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
    },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
