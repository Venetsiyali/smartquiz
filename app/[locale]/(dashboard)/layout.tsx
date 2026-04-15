'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Bosh panel', icon: '📊' },
    { href: '/dashboard/quizzes', label: "Quizlarim", icon: '🧩' },
    { href: '/dashboard/analytics', label: 'Tahlil', icon: '📈' },
];

function Sidebar({ locale, onClose }: { locale: string; onClose?: () => void }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside
            className="flex flex-col h-full"
            style={{
                background: 'rgba(10,14,30,0.97)',
                borderRight: '1px solid rgba(255,255,255,0.07)',
                width: 240,
                minWidth: 240,
            }}
        >
            {/* Logo */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
                <Link href={`/${locale}`} className="flex items-center gap-2" onClick={onClose}>
                    <span className="text-2xl">⚡</span>
                    <span className="text-white font-black text-lg tracking-tight">Zukkoo</span>
                </Link>
                {onClose && (
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl">✕</button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                {NAV_ITEMS.map(item => {
                    const fullHref = `/${locale}${item.href}`;
                    const isActive = pathname === fullHref || (item.href !== '/dashboard' && pathname.startsWith(fullHref));
                    return (
                        <Link
                            key={item.href}
                            href={fullHref}
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
                            style={{
                                background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                                color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.55)',
                                border: isActive ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                            }}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Quick links */}
            <div className="px-3 py-3 border-t border-white/5 flex flex-col gap-1">
                <Link
                    href={`/${locale}/play`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
                >
                    <span>🎮</span>
                    <span>O'ynash</span>
                </Link>
                <Link
                    href={`/${locale}/quiz/create`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ background: 'rgba(0,230,118,0.1)', color: '#00E676', border: '1px solid rgba(0,230,118,0.2)' }}
                >
                    <span>➕</span>
                    <span>Yangi quiz</span>
                </Link>
            </div>

            {/* User */}
            {session?.user && (
                <div className="px-4 py-4 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                        {session.user.image ? (
                            <Image src={session.user.image} alt="" width={32} height={32} className="object-cover" />
                        ) : (
                            <span className="text-sm font-black text-white">{session.user.name?.[0]?.toUpperCase() ?? '?'}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate">{session.user.name ?? 'Foydalanuvchi'}</p>
                        <p className="text-white/30 text-xs truncate">{session.user.email}</p>
                    </div>
                </div>
            )}
        </aside>
    );
}

export default function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div
            className="min-h-screen flex"
            style={{ background: 'radial-gradient(ellipse at top left, #0f172a 0%, #020617 100%)' }}
        >
            {/* Desktop sidebar */}
            <div className="hidden md:flex shrink-0">
                <Sidebar locale={params.locale} />
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setSidebarOpen(false)}
                >
                    <div onClick={e => e.stopPropagation()} className="h-full flex">
                        <Sidebar locale={params.locale} onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile topbar */}
                <div
                    className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5"
                    style={{ background: 'rgba(10,14,30,0.9)' }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-white/60 hover:text-white transition-colors"
                        aria-label="Menu"
                    >
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                            <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                    <span className="text-white font-black">⚡ Zukkoo</span>
                    <div className="w-6" />
                </div>

                {/* Page */}
                <main className="flex-1 p-4 md:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
