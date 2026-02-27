'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { CrownBadge } from "@/lib/subscriptionContext";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
    const t = useTranslations('Header');
    const { data: session } = useSession();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" });
    };

    return (
        <nav className="relative z-50 flex items-center justify-between px-6 py-5 md:px-12 bg-transparent">
            {/* Logo area */}
            <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => router.push('/')}
            >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #0056b3, #FFD600)' }}>
                    Z
                </div>
                <span className="text-2xl font-black text-white tracking-widest">
                    Zukk<span className="logo-z text-blue-500">oo</span>
                </span>

                {/* Optional Plan Badge */}
                {session?.user?.plan === 'PRO' && <CrownBadge />}
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
                <LanguageSwitcher />

                <button
                    onClick={() => router.push('/muallif')}
                    className="hidden sm:inline-flex px-4 py-2 rounded-xl font-bold text-sm text-white/70 hover:text-white transition-all bg-white/5 hover:bg-white/10"
                >
                    👤 {t('author')}
                </button>

                {session ? (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex items-center gap-3 focus:outline-none p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                        >
                            <span className="hidden md:block text-sm font-bold text-white px-2">
                                {session.user.name || t('user')}
                            </span>
                            {session.user.image ? (
                                <Image
                                    src={session.user.image}
                                    alt="Avatar"
                                    width={36}
                                    height={36}
                                    className="rounded-full shadow-md object-cover border border-white/20"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white uppercase shadow-md border border-white/20">
                                    {session.user.name?.[0] || "U"}
                                </div>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                            <div className="absolute right-0 mt-3 w-48 bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl overflow-hidden py-2 backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-white/10 mb-2">
                                    <p className="text-sm text-white font-medium truncate">{session.user.name}</p>
                                    <p className="text-xs text-white/50 truncate">{session.user.email}</p>
                                </div>
                                <button
                                    onClick={() => router.push('/settings')}
                                    className="w-full text-left px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                >
                                    ⚙️ {t('settings')}
                                </button>
                                {session.user.role === "ADMIN" && (
                                    <button
                                        onClick={() => router.push('/admin')}
                                        className="w-full text-left px-4 py-2 text-sm text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors flex items-center gap-2"
                                    >
                                        🛠️ {t('adminPanel')}
                                    </button>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2 mt-1"
                                >
                                    🚪 {t('logout')}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => router.push('/login')}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    >
                        {t('login')}
                    </button>
                )}
            </div>
        </nav>
    );
}
