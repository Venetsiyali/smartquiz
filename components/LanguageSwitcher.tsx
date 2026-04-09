'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition, useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    
    // Dropdown state
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const switchLocale = (newLocale: string) => {
        setOpen(false);
        if (newLocale === locale) return;

        startTransition(() => {
            const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
            const finalPath = pathname.startsWith(`/${locale}`)
                ? newPathname
                : `/${newLocale}${pathname === '/' ? '' : pathname}`;

            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
            router.push(finalPath);
            router.refresh();
        });
    };

    const langs = [
        { code: 'uz', flag: '🇺🇿', label: 'UZ' },
        { code: 'ru', flag: '🇷🇺', label: 'RU' },
        { code: 'en', flag: '🇬🇧', label: 'EN' },
    ];
    
    const activeLang = langs.find(l => l.code === locale) || langs[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 focus:outline-none px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 shadow-sm"
            >
                <span className="text-lg">{activeLang.flag}</span>
                <span className="text-sm font-bold text-white uppercase hidden sm:block">{activeLang.label}</span>
                <span className="text-[10px] text-white/50 ml-1">▼</span>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-32 bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl overflow-hidden py-1 backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {langs.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => switchLocale(lang.code)}
                            disabled={isPending}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                                locale === lang.code 
                                ? 'bg-blue-500/20 text-blue-400 font-bold border-l-2 border-blue-500' 
                                : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-base">{lang.flag}</span>
                                <span>{lang.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
