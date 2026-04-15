'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBanner() {
    const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Don't show if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        // Don't show if user already dismissed
        const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
        if (dismissed) return;

        // Only show on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) return;

        const handler = (e: Event) => {
            e.preventDefault();
            setPrompt(e as BeforeInstallPromptEvent);
            setVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    async function handleInstall() {
        if (!prompt) return;
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
            setVisible(false);
        }
        setPrompt(null);
    }

    function handleDismiss() {
        sessionStorage.setItem('pwa-banner-dismissed', '1');
        setVisible(false);
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="fixed bottom-4 left-3 right-3 z-50 md:hidden"
                >
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
                        style={{
                            background: 'rgba(10,14,30,0.97)',
                            border: '1px solid rgba(0,230,118,0.3)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,230,118,0.1)',
                        }}
                    >
                        {/* Icon */}
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                            style={{ background: 'linear-gradient(135deg, #00E676, #00C853)' }}
                        >
                            ⚡
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-black text-sm leading-tight">
                                Zukkoo ilovasini o'rnating
                            </p>
                            <p className="text-white/40 text-xs font-semibold mt-0.5">
                                Tezroq kirish va offline rejim
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleDismiss}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white/40 hover:text-white/60 transition-colors"
                                aria-label="Keyinroq"
                            >
                                Keyinroq
                            </button>
                            <button
                                onClick={handleInstall}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95"
                                style={{ background: 'linear-gradient(135deg, #00E676, #00C853)', color: '#000' }}
                            >
                                O'rnatish
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
