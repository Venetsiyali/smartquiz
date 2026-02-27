import { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#050B14] text-white flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-[#0A101D] border-r border-yellow-500/20 flex flex-col border-b md:border-b-0">
                <div className="p-6 border-b border-yellow-500/20 flex items-center justify-between md:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl font-black bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.4)] text-[#050B14]">
                            👑
                        </div>
                        <span className="font-black text-xl tracking-wider text-white">ZUKKOO <span className="text-yellow-500">ADMIN</span></span>
                    </div>
                </div>
                <nav className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
                    <Link href="/admin" className="whitespace-nowrap px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5">
                        📊 Dashboard
                    </Link>
                    <Link href="/admin/users" className="whitespace-nowrap px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-[inset_0_0_10px_rgba(234,179,8,0.1)]">
                        👥 Foydalanuvchilar
                    </Link>
                    <Link href="/" className="whitespace-nowrap px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 mt-auto">
                        ← Saytga qaytish
                    </Link>
                </nav>
            </aside>
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Background ambient glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
                <div className="p-6 md:p-10 z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
