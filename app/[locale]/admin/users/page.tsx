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

const ROLES = ['STUDENT', 'TEACHER', 'MODERATOR', 'ADMIN'];

const ROLE_STYLES: Record<string, string> = {
    ADMIN: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    MODERATOR: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    TEACHER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    STUDENT: 'bg-white/5 text-white/60 border-white/10',
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

    const showToast = (text: string, ok = true) => {
        setToast({ text, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const loadUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    const handleUpgradeToPro = async (userId: string) => {
        if (!confirm("Foydalanuvchini PRO rejasiga o'tkazmoqchimisiz?")) return;
        setProcessingId(userId + '_pro');
        try {
            const res = await fetch(`/api/admin/users/${userId}/pro`, { method: "POST" });
            if (res.ok) {
                showToast("✅ PRO berildi! Elektron pochta yuborildi.");
                await loadUsers();
            } else {
                const d = await res.json();
                showToast(d.error || "Xatolik", false);
            }
        } catch { showToast("Tizim xatosi", false); }
        finally { setProcessingId(null); }
    };

    const handleDowngradeToFree = async (userId: string, userEmail: string) => {
        if (!confirm(`${userEmail} foydalanuvchisining PRO statusini olib tashlaysizmi?`)) return;
        setProcessingId(userId + '_free');
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: 'FREE' }),
            });
            if (res.ok) {
                showToast("✅ FREE ga o'tkazildi.");
                await loadUsers();
            } else {
                const d = await res.json();
                showToast(d.error || "Xatolik", false);
            }
        } catch { showToast("Tizim xatosi", false); }
        finally { setProcessingId(null); }
    };

    const handleRoleChange = async (userId: string, newRole: string, currentRole: string) => {
        if (newRole === currentRole) return;
        if (!confirm(`Rolni "${currentRole}" dan "${newRole}" ga o'zgartirmoqchimisiz?`)) return;
        setProcessingId(userId + '_role');
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                showToast(`✅ Rol "${newRole}" ga o'zgartirildi.`);
                await loadUsers();
            } else {
                const d = await res.json();
                showToast(d.error || "Xatolik", false);
            }
        } catch { showToast("Tizim xatosi", false); }
        finally { setProcessingId(null); }
    };

    const filtered = users.filter(u =>
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl transition-all"
                    style={toast.ok ? { background: 'rgba(0,230,118,0.15)', color: '#00E676', border: '1px solid rgba(0,230,118,0.3)' } : { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {toast.text}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <p className="text-white/30 text-xs font-black tracking-widest uppercase mb-1">Admin · Foydalanuvchilar</p>
                    <h1 className="text-3xl font-black text-white">👥 Foydalanuvchilar Paneli</h1>
                </div>
                <div className="flex items-center gap-3">
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="🔍 Ism yoki email..."
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-blue-500/50 w-48" />
                    <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap">
                        Jami: {users.length} ta
                    </div>
                </div>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'ADMIN', count: users.filter(u => u.role === 'ADMIN').length, color: '#fbbf24' },
                    { label: 'TEACHER', count: users.filter(u => u.role === 'TEACHER').length, color: '#60a5fa' },
                    { label: 'STUDENT', count: users.filter(u => u.role === 'STUDENT').length, color: '#a78bfa' },
                    { label: 'PRO', count: users.filter(u => u.plan === 'PRO').length, color: '#00E676' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 flex flex-col gap-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-xs font-black text-white/30 uppercase tracking-wider">{s.label}</p>
                        <p className="text-2xl font-black" style={{ color: s.color }}>{s.count}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,16,29,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                {['Foydalanuvchi', 'Rol', 'Tarif', "O'yinlar", "So'nggi faollik", 'Amallar'].map(h => (
                                    <th key={h} className="p-4 text-white/40 font-black text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((user) => (
                                <tr key={user.id} className="border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.02]">
                                    {/* User info */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {user.image ? (
                                                <Image src={user.image} alt="avatar" width={36} height={36} className="rounded-full border border-white/10" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
                                                    {user.name?.[0] || user.email?.[0] || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-white font-bold text-sm">{user.name || "Noma'lum"}</p>
                                                <p className="text-white/40 text-xs">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role dropdown */}
                                    <td className="p-4">
                                        <select
                                            value={user.role}
                                            onChange={e => handleRoleChange(user.id, e.target.value, user.role)}
                                            disabled={processingId === user.id + '_role'}
                                            className={`px-2.5 py-1.5 rounded-xl text-xs font-black border cursor-pointer outline-none transition-all disabled:opacity-50 ${ROLE_STYLES[user.role] || ROLE_STYLES.STUDENT}`}
                                            style={{ background: 'transparent', colorScheme: 'dark' }}
                                        >
                                            {ROLES.map(r => (
                                                <option key={r} value={r} style={{ background: '#0d1a2e', color: 'white' }}>{r}</option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* Plan */}
                                    <td className="p-4">
                                        {user.plan === 'PRO' ? (
                                            <span className="flex items-center gap-1.5 text-yellow-400 font-black text-xs bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20 w-fit">
                                                👑 PRO
                                            </span>
                                        ) : (
                                            <span className="text-white/50 text-xs font-bold px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 w-fit">
                                                FREE
                                            </span>
                                        )}
                                    </td>

                                    {/* Games */}
                                    <td className="p-4 text-white/70 font-bold text-sm">
                                        {user.totalGamesPlayed}
                                    </td>

                                    {/* Last login */}
                                    <td className="p-4 text-white/40 text-xs">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("uz-UZ", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Hali kirmagan"}
                                    </td>

                                    {/* Actions */}
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {user.plan === 'FREE' ? (
                                                <button
                                                    onClick={() => handleUpgradeToPro(user.id)}
                                                    disabled={!!processingId}
                                                    className="px-3 py-1.5 rounded-xl text-xs font-black transition-all hover:scale-105 disabled:opacity-50 whitespace-nowrap"
                                                    style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000' }}
                                                >
                                                    {processingId === user.id + '_pro' ? '⏳' : '👑 PRO'  }
                                                </button>
                                            ) : user.role !== 'ADMIN' && (
                                                <button
                                                    onClick={() => handleDowngradeToFree(user.id, user.email || '')}
                                                    disabled={!!processingId}
                                                    className="px-3 py-1.5 rounded-xl text-xs font-black transition-all hover:scale-105 disabled:opacity-50"
                                                    style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                                                >
                                                    {processingId === user.id + '_free' ? '⏳' : 'FREE qilish'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-white/30 font-bold">
                                        {search ? 'Qidiruv natijasi topilmadi' : 'Hali foydalanuvchilar mavjud emas'}
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
