// Login, settings, teacher, admin sahifalari — NOINDEX
// Bu sahifalar saytning ichki qismiga kiradi, Google indekslamasin
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Kirish | Zukkoo.uz',
    robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
    },
};
