import { Metadata } from 'next';
import Header from '@/components/Header';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    return {
        title: "Biz Haqimizda | Zukkoo.uz",
        description: "Zukkoo.uz — O'zbekiston o'qituvchilari uchun yaratilgan bepul interaktiv quiz va gamifikatsiya platformasi. TATU ATT bo'limi, missiya va jamoa.",
        alternates: {
            canonical: `https://www.zukkoo.uz/${params.locale}/about`,
        },
        openGraph: {
            title: "Biz Haqimizda | Zukkoo.uz",
            description: "O'zbekiston ta'limini interaktiv va qiziqarli qilish missiyasi. TATU ATT bo'limi tomonidan yaratilgan gamifikatsiya platformasi.",
            type: 'website',
            url: `https://www.zukkoo.uz/${params.locale}/about`,
            siteName: 'Zukkoo.uz',
        },
        robots: { index: true, follow: true },
    };
}

function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <div
            className="flex flex-col items-center text-center p-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
            <span className="text-3xl font-black text-white">{value}</span>
            <span className="text-white/40 text-xs font-bold mt-1">{label}</span>
        </div>
    );
}

export default function AboutPage({ params }: { params: { locale: string } }) {
    return (
        <div className="bg-landing min-h-screen flex flex-col text-white">
            <Header />

            <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-12 md:px-8">
                <article className="w-full max-w-3xl">
                    {/* Header */}
                    <div className="mb-10">
                        <p className="text-white/30 text-xs font-black tracking-widest uppercase mb-2">Platforma haqida</p>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">⚡ Biz Haqimizda</h1>
                        <p className="text-white/40 text-sm font-semibold">
                            Yangilangan: <span className="text-white/60">Aprel 2026</span>
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-10">
                        <StatCard value="500+" label="Faol o'qituvchi" />
                        <StatCard value="50 000+" label="O'yin o'ynaldi" />
                        <StatCard value="6" label="O'yin turi" />
                    </div>

                    {/* Main card */}
                    <div
                        className="rounded-3xl p-8 md:p-10 space-y-10"
                        style={{ background: 'rgba(10,14,30,0.8)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                    >
                        {/* What is Zukkoo */}
                        <section>
                            <h2 className="text-xl font-black text-white mb-4 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                Zukkoo nima?
                            </h2>
                            <div className="text-white/60 leading-relaxed space-y-3 text-sm">
                                <p>
                                    <span className="text-white/80 font-bold">Zukkoo.uz</span> — O'zbekiston
                                    o'qituvchilari va talabalar uchun yaratilgan{' '}
                                    <span className="text-white/80 font-bold">bepul interaktiv quiz va gamifikatsiya
                                    platformasi</span>. Kahoot, Quizlet va Gimkit kabi global platformalarning
                                    O'zbek tilidagi to'liq muqobili.
                                </p>
                                <p>
                                    Platforma orqali o'qituvchilar daqiqalar ichida interaktiv quiz yaratadi, PIN-kod
                                    yoki QR orqali o'quvchilarni ulaydi va real-vaqt rejimida natijalarni kuzatadi.
                                    O'quvchilar smartfonlari orqali ishtirok etadi — hech qanday ilova yuklab olish
                                    shart emas.
                                </p>
                                <p>
                                    AI yordamida savol generatsiyasi, 6 xil o'yin formati, gamifikatsiya
                                    (XP, streak, badge, leaderboard) — bularning barchasi bepul taqdim etiladi.
                                </p>
                            </div>
                        </section>

                        {/* Mission */}
                        <section>
                            <h2 className="text-xl font-black text-white mb-4 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                Bizning missiya
                            </h2>
                            <div
                                className="text-sm leading-relaxed p-5 rounded-2xl"
                                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
                            >
                                <p className="text-white/80 font-bold text-base mb-2">
                                    "O'zbekiston ta'limini interaktiv va qiziqarli qilish"
                                </p>
                                <p className="text-white/50">
                                    Biz an'anaviy dars o'tkazish usullarini raqamli texnologiyalar va o'yin
                                    elementlari bilan boyitib, ta'lim samaradorligini oshirishni maqsad qilamiz.
                                    Har bir o'qituvchi qimmatbaho qurolga ega bo'lishi kerak — va u bepul bo'lishi
                                    shart.
                                </p>
                            </div>
                        </section>

                        {/* Why Zukkoo */}
                        <section>
                            <h2 className="text-xl font-black text-white mb-4 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                Nima uchun Zukkoo?
                            </h2>
                            <div className="text-white/60 text-sm space-y-3">
                                <div className="flex gap-3">
                                    <span className="text-xl shrink-0">🇺🇿</span>
                                    <div>
                                        <p className="text-white/80 font-bold">O'zbek tilidagi interfeys</p>
                                        <p>Barcha tugmalar, xabarlar va kontent o'zbek tilida. Rus va ingliz tillari ham qo'llab-quvvatlanadi.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-xl shrink-0">🆓</span>
                                    <div>
                                        <p className="text-white/80 font-bold">Asosiy funksiyalar bepul</p>
                                        <p>Quiz yaratish, real-vaqt o'yin, leaderboard — barchasi bepul. Pro tarif qo'shimcha imkoniyatlar beradi.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-xl shrink-0">🤖</span>
                                    <div>
                                        <p className="text-white/80 font-bold">AI yordamida savol yaratish</p>
                                        <p>Mavzu kiriting — sun'iy intellekt bir necha soniyada 10 ta noyob savol generatsiya qiladi.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-xl shrink-0">🎮</span>
                                    <div>
                                        <p className="text-white/80 font-bold">6 xil o'yin formati</p>
                                        <p>Klassik viktorina, tartib, moslashtirish, blitz, anagram, jamoaviy — har bir dars uchun mos format.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Team */}
                        <section>
                            <h2 className="text-xl font-black text-white mb-4 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                Jamoa
                            </h2>
                            <div className="text-white/60 text-sm space-y-3">
                                <p>
                                    Zukkoo.uz{' '}
                                    <span className="text-white/80 font-bold">
                                        Muhammad al-Xorazmiy nomidagi Toshkent axborot texnologiyalari universiteti
                                        (TATU)
                                    </span>{' '}
                                    Axborot va ta'lim texnologiyalari (ATT) bo'limi tomonidan ilmiy-amaliy
                                    loyiha sifatida yaratilgan.
                                </p>
                                <div
                                    className="flex items-start gap-4 p-4 rounded-2xl"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                                        style={{ background: 'rgba(59,130,246,0.15)' }}
                                    >
                                        👨‍🏫
                                    </div>
                                    <div>
                                        <p className="text-white font-black">Rustamjon Nasridinov</p>
                                        <p className="text-blue-400 text-xs font-bold mt-0.5">
                                            PhD Tadqiqotchi · TATU Katta O'qituvchi
                                        </p>
                                        <p className="text-white/40 text-xs mt-1">
                                            Ta'lim texnologiyalari, gamifikatsiya va gidrologik monitoring bo'yicha
                                            ilmiy tadqiqotlar. ORCID: 0009-0003-2422-9029
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Contact */}
                        <section>
                            <h2 className="text-xl font-black text-white mb-4 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                Aloqa
                            </h2>
                            <div className="text-white/60 text-sm space-y-3">
                                <p>Takliflar, hamkorlik yoki savollar uchun murojaat qiling:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <a
                                        href="mailto:info@zukkoo.uz"
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                                    >
                                        <span className="text-xl">📧</span>
                                        <div>
                                            <p className="text-white/80 font-bold text-xs">Email</p>
                                            <p className="text-blue-400 font-bold text-sm">info@zukkoo.uz</p>
                                        </div>
                                    </a>
                                    <a
                                        href="https://t.me/zukkoo_uz"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                                    >
                                        <span className="text-xl">💬</span>
                                        <div>
                                            <p className="text-white/80 font-bold text-xs">Telegram</p>
                                            <p className="text-blue-400 font-bold text-sm">@zukkoo_uz</p>
                                        </div>
                                    </a>
                                    <a
                                        href="https://instagram.com/zukkoo.uz"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                                    >
                                        <span className="text-xl">📸</span>
                                        <div>
                                            <p className="text-white/80 font-bold text-xs">Instagram</p>
                                            <p className="text-blue-400 font-bold text-sm">@zukkoo.uz</p>
                                        </div>
                                    </a>
                                    <div
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                                    >
                                        <span className="text-xl">🏛️</span>
                                        <div>
                                            <p className="text-white/80 font-bold text-xs">Manzil</p>
                                            <p className="text-white/50 text-sm">TATU, Toshkent, O'zbekiston</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* CTA */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Link
                                href={`/${params.locale}/play`}
                                className="flex-1 text-center py-3 rounded-xl font-black text-sm transition-all hover:scale-105"
                                style={{ background: 'linear-gradient(135deg, #00E676, #00C853)', color: '#000' }}
                            >
                                🚀 Hozir Boshlang — Bepul
                            </Link>
                            <Link
                                href={`/${params.locale}/muallif`}
                                className="flex-1 text-center py-3 rounded-xl font-black text-sm transition-all hover:scale-105"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                👨‍🏫 Muallif haqida
                            </Link>
                        </div>

                        {/* Footer note */}
                        <div
                            className="pt-6 text-center text-white/20 text-xs font-semibold"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            Yangilangan: Aprel 2026 · Zukkoo.uz ·{' '}
                            <Link href={`/${params.locale}/privacy`} className="hover:text-white/40 transition-colors">Maxfiylik</Link>
                            {' · '}
                            <Link href={`/${params.locale}/terms`} className="hover:text-white/40 transition-colors">Shartlar</Link>
                        </div>
                    </div>
                </article>
            </main>
        </div>
    );
}
