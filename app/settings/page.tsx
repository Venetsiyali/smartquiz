'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function SettingsPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

    const [name, setName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isLoadingName, setIsLoadingName] = useState(false);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);
    const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
        if (session?.user?.name) {
            setName(session.user.name);
        }
    }, [status, session, router]);

    const handleNameUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setNameMsg(null);
        setIsLoadingName(true);
        try {
            const res = await fetch("/api/user/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (res.ok) {
                setNameMsg({ type: "success", text: "Ismingiz muvaffaqiyatli saqlandi!" });
                await update({ name: data.user.name });
            } else {
                setNameMsg({ type: "error", text: data.error || "Xatolik yuz berdi" });
            }
        } catch {
            setNameMsg({ type: "error", text: "Tarmoq xatosi" });
        } finally {
            setIsLoadingName(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMsg(null);
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: "error", text: "Yangi parollar bir-biriga mos emas" });
            return;
        }
        setIsLoadingPassword(true);
        try {
            const res = await fetch("/api/user/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setPasswordMsg({ type: "success", text: "Parol muvaffaqiyatli yangilandi! Qayta kiring." });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => signOut({ callbackUrl: "/login" }), 2000);
            } else {
                setPasswordMsg({ type: "error", text: data.error || "Xatolik yuz berdi" });
            }
        } catch {
            setPasswordMsg({ type: "error", text: "Tarmoq xatosi" });
        } finally {
            setIsLoadingPassword(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1c] text-white">
            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[150px]"></div>
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white/60 hover:text-white"
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white">Sozlamalar</h1>
                        <p className="text-white/50 text-sm">Hisobingizni boshqaring</p>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        {session?.user?.image ? (
                            <Image
                                src={session.user.image}
                                alt="Avatar"
                                width={64}
                                height={64}
                                className="rounded-2xl border border-white/10 shadow-lg"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-black shadow-lg border border-white/10">
                                {session?.user?.name?.[0]?.toUpperCase() || "?"}
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-white text-lg">{session?.user?.name}</p>
                            <p className="text-white/50 text-sm">{session?.user?.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${session?.user?.role === "ADMIN"
                                        ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                                        : session?.user?.role === "TEACHER"
                                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                            : "bg-white/5 text-white/60 border-white/10"
                                    }`}>
                                    {session?.user?.role || "STUDENT"}
                                </span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${session?.user?.plan === "PRO"
                                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                        : "bg-white/5 text-white/50 border-white/10"
                                    }`}>
                                    {session?.user?.plan === "PRO" ? "👑 PRO" : "FREE"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Name */}
                <form onSubmit={handleNameUpdate} className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 backdrop-blur-sm">
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-lg">✏️</span> Ismni o'zgartirish
                    </h2>
                    <div className="space-y-4">
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ismingiz"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        {nameMsg && (
                            <p className={`text-sm font-medium ${nameMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                                {nameMsg.type === "success" ? "✅" : "❌"} {nameMsg.text}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={isLoadingName}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl font-bold text-sm transition-all"
                        >
                            {isLoadingName ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saqlanmoqda...
                                </span>
                            ) : "Saqlash"}
                        </button>
                    </div>
                </form>

                {/* Change Password */}
                <form onSubmit={handlePasswordUpdate} className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 backdrop-blur-sm">
                    <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                        <span className="text-lg">🔑</span> Parolni o'zgartirish
                    </h2>
                    <p className="text-white/40 text-xs mb-4">
                        {session?.user?.image && !session?.user?.email?.includes("@")
                            ? "Google akkauntida parol yo'q. Yangi parol o'rnating."
                            : "Eski parolni kiriting va yangi parol yarating."}
                    </p>
                    <div className="space-y-3">
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            placeholder="Eski parol (agar mavjud bo'lsa)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Yangi parol (kamida 6 ta belgi)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Yangi parolni tasdiqlang"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        {passwordMsg && (
                            <p className={`text-sm font-medium ${passwordMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                                {passwordMsg.type === "success" ? "✅" : "❌"} {passwordMsg.text}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={isLoadingPassword}
                            className="w-full h-11 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 rounded-xl font-bold text-sm transition-all"
                        >
                            {isLoadingPassword ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saqlanmoqda...
                                </span>
                            ) : "Parolni yangilash"}
                        </button>
                    </div>
                </form>

                {/* Danger zone */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                    <h2 className="text-base font-bold text-red-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">🚪</span> Hisobdan chiqish
                    </h2>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full h-11 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl font-bold text-sm text-red-400 hover:text-red-300 transition-all"
                    >
                        Tizimdan chiqish
                    </button>
                </div>
            </div>
        </div>
    );
}
