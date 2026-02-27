'use client';

import { useEffect, useState } from "react";
import Image from "next/image";

type User = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    plan: string;
    lastLogin: string | null;
    totalGamesPlayed: number;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleUpgradeToPro = async (userId: string) => {
        if (!confirm("Haqiqatan ham ushbu foydalanuvchini PRO rejasiga o'tkazmoqchimisiz?")) return;

        setProcessingId(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/pro`, {
                method: "POST",
            });
            if (res.ok) {
                alert("Muvaffaqiyatli! STATUS: PRO 👑 va pochtasiga xat yuborildi.");
                await loadUsers();
            } else {
                const data = await res.json();
                alert(data.error || "Xatolik yuz berdi");
            }
        } catch (error) {
            console.error(error);
            alert("Tizim xatosi");
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black text-white">
                    Foydalanuvchilar Paneli
                </h1>
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-xl text-sm font-bold">
                    Jami: {users.length} ta
                </div>
            </div>

            <div className="bg-[#0A101D] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold">Foydalanuvchi</th>
                                <th className="p-4 font-bold">Rol</th>
                                <th className="p-4 font-bold">Tarif</th>
                                <th className="p-4 font-bold">O'yinlar Soni</th>
                                <th className="p-4 font-bold">So'nggi faollik</th>
                                <th className="p-4 font-bold text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {user.image ? (
                                                <Image
                                                    src={user.image}
                                                    alt="avatar"
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full border border-white/10"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
                                                    {user.name?.[0] || user.email?.[0] || "?"}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-white font-bold">{user.name || "Noma'lum"}</p>
                                                <p className="text-white/50 text-xs">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                user.role === 'TEACHER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    'bg-white/5 text-white/70 border border-white/10'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {user.plan === 'PRO' ? (
                                            <span className="flex items-center gap-1.5 text-yellow-400 font-bold text-sm bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20 w-fit">
                                                👑 PRO
                                            </span>
                                        ) : (
                                            <span className="text-white/50 text-sm font-medium px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 w-fit">
                                                FREE
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-white/80 font-medium">
                                        {user.totalGamesPlayed}
                                    </td>
                                    <td className="p-4 text-white/50 text-sm">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("uz-UZ", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Hali kirmagan"}
                                    </td>
                                    <td className="p-4 text-right">
                                        {user.plan === 'FREE' && user.role !== 'ADMIN' && (
                                            <button
                                                onClick={() => handleUpgradeToPro(user.id)}
                                                disabled={processingId === user.id}
                                                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50"
                                            >
                                                {processingId === user.id ? "Yuklanmoqda..." : "PRO berish 👑"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-white/50">
                                        Hali foydalanuvchilar mavjud emas
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
