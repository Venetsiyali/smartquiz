'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const switchLocale = (newLocale: string) => {
        if (newLocale === locale) return;

        startTransition(() => {
            // Because our URLs start with /[locale], we just replace the first part
            const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);

            // If the pathname doesn't have a locale prefix (e.g. they are on / and middleware redirected),
            // just appending or pushing to exactly /newLocale/...
            const finalPath = pathname.startsWith(`/${locale}`)
                ? newPathname
                : `/${newLocale}${pathname === '/' ? '' : pathname}`;

            // We can store a cookie or let next-intl handle the cookie automatically by routing to /newLocale
            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
            router.push(finalPath);
            router.refresh();
        });
    };

    return (
        <div className="flex bg-white/5 border border-white/10 rounded-full p-1 shadow-inner backdrop-blur-md">
            <button
                onClick={() => switchLocale('uz')}
                disabled={isPending}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 ${locale === 'uz'
                        ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                        : 'text-white/50 hover:text-white hover:bg-white/10'
                    }`}
            >
                UZ
            </button>
            <button
                onClick={() => switchLocale('ru')}
                disabled={isPending}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 ${locale === 'ru'
                        ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                        : 'text-white/50 hover:text-white hover:bg-white/10'
                    }`}
            >
                RU
            </button>
        </div>
    );
}
