import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
    const totalUsers = await prisma.user.count();
    const proUsers = await prisma.user.count({ where: { plan: "PRO" } });
    const teacherUsers = await prisma.user.count({ where: { role: "TEACHER" } });

    // Total games played calculation
    const users = await prisma.user.findMany({ select: { totalGamesPlayed: true } });
    const totalGames = users.reduce((acc, user) => acc + (user.totalGamesPlayed || 0), 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                Peshqadamlar paneli
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-white group-hover:w-full transition-all duration-300 opacity-10 z-0"></div>
                    <div className="relative z-10">
                        <p className="text-white/50 text-sm font-bold mb-2 tracking-widest leading-relaxed">FOYDALANUVCHILAR</p>
                        <p className="text-4xl font-black text-white">{totalUsers}</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-600/10 border border-yellow-500/20 rounded-2xl p-6 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 blur-[50px] group-hover:bg-yellow-400/40 transition-colors duration-500 z-0"></div>
                    <div className="relative z-10">
                        <p className="text-yellow-500/80 text-sm font-bold mb-2 tracking-widest leading-relaxed">PRO TIZIMDA</p>
                        <p className="text-4xl font-black text-yellow-400 flex items-center gap-3">
                            {proUsers}
                        </p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-full transition-all duration-300 opacity-10 z-0"></div>
                    <div className="relative z-10">
                        <p className="text-blue-400/80 text-sm font-bold mb-2 tracking-widest leading-relaxed">O'QITUVCHILAR</p>
                        <p className="text-4xl font-black text-blue-400">{teacherUsers}</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 group-hover:w-full transition-all duration-300 opacity-10 z-0"></div>
                    <div className="relative z-10">
                        <p className="text-purple-400/80 text-sm font-bold mb-2 tracking-widest leading-relaxed">JAMI O'YINLAR</p>
                        <p className="text-4xl font-black text-purple-400">{totalGames}</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                <h2 className="text-xl font-bold text-white mb-4">PhD Tadqiqotingiz haqida</h2>
                <p className="text-white/60 leading-relaxed text-sm">
                    Bu panel orqali platformaga tashrif buyurgan barcha odamlarni boshqarish mumkin. Chap paneldagi "Foydalanuvchilar" darchasiga otib ularning ro'yxatini, holati va rollarini ko'rishingiz, hamda Premium a'zoliklarni (PRO) avtomatik faollashtirishingiz amalga oshiriladi. Barcha PRO berilgan shaxslar <strong className="text-white">Resend API</strong> orqali Email ogohlantirish tabriklarini oladilar.
                </p>
            </div>
        </div>
    );
}
