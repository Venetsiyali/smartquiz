'use client';

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/");
        }
    }, [status, router]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        await signIn("google", { callbackUrl: "/" });
    };

    if (status === "loading" || status === "authenticated") {
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="text-4xl font-black text-white">
                        Zukk<span className="text-blue-500">oo</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1c] flex flex-col md:flex-row relative overflow-hidden">
            {/* Background cyber grid and glow */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Left Panel: Hero Image */}
            <div className="hidden md:flex w-1/2 p-8 items-center justify-center relative z-10">
                <div className="relative w-full max-w-2xl aspect-[2/1] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.2)] border border-white/10 group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/50 to-transparent mix-blend-overlay z-10 pointer-events-none"></div>
                    <Image
                        src="/images/hero.jpg"
                        alt="Zukkoo Hero"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        priority
                        unoptimized
                    />
                    <div className="absolute bottom-0 left-0 r-0 w-full p-8 bg-gradient-to-t from-black/80 to-transparent z-20">
                        <h2 className="text-3xl font-black text-white mb-2">Kelajak ta'limi shu yerda</h2>
                        <p className="text-white/70">O'quvchilaringizni Zukkoo bilan yangi darajaga olib chiqing</p>
                    </div>
                </div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative z-10">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                    {/* Glassmorphism shine */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                    <div className="text-center mb-10 relative z-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 mb-6 shadow-inner">
                            <span className="text-2xl">🎓</span>
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                            Zukkoo.uz ga xush kelibsiz
                        </h1>
                        <p className="text-white/50 text-sm font-medium">
                            Platformaga kirish uchun profilingizni tasdiqlang
                        </p>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full h-14 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-bold text-base transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.2)]"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google orqali kirish
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
