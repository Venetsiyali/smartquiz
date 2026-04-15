import { Metadata } from 'next';
import Header from '@/components/Header';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    return {
        title: "Maxfiylik Siyosati | Zukkoo.uz",
        description: "Zukkoo.uz platformasi foydalanuvchilarning shaxsiy ma'lumotlarini qanday to'plashi, saqlashi va himoya qilishi haqida to'liq ma'lumot.",
        alternates: {
            canonical: `https://www.zukkoo.uz/${params.locale}/privacy`,
        },
        robots: { index: true, follow: true },
    };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-10">
            <h2 className="text-xl font-black text-white mb-4 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {title}
            </h2>
            <div className="text-white/60 leading-relaxed space-y-3 text-sm">
                {children}
            </div>
        </section>
    );
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
    return (
        <div className="bg-landing min-h-screen flex flex-col text-white">
            <Header />

            <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-12 md:px-8">
                <article className="w-full max-w-3xl">
                    {/* Header */}
                    <div className="mb-10">
                        <p className="text-white/30 text-xs font-black tracking-widest uppercase mb-2">Huquqiy hujjat</p>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">🔒 Maxfiylik Siyosati</h1>
                        <p className="text-white/40 text-sm font-semibold">
                            Oxirgi yangilanish: <span className="text-white/60">Aprel 2026</span>
                        </p>
                    </div>

                    {/* Card */}
                    <div
                        className="rounded-3xl p-8 md:p-10"
                        style={{ background: 'rgba(10,14,30,0.8)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                    >
                        <Section title="1. Kirish">
                            <p>
                                Zukkoo.uz ("biz", "bizning platforma") foydalanuvchilarning shaxsiy ma'lumotlarini
                                himoya qilishni jiddiy qabul qiladi. Ushbu Maxfiylik Siyosati siz platformamizdan
                                foydalanganda qanday ma'lumotlarni to'plashimiz, ulardan qanday foydalanishimiz va
                                qanday himoya qilishimizni tushuntiradi.
                            </p>
                            <p>
                                Zukkoo.uz ga ro'yxatdan o'tish yoki undan foydalanish orqali siz ushbu siyosat
                                shartlariga rozilik bildirasiz.
                            </p>
                        </Section>

                        <Section title="2. To'planadigan ma'lumotlar">
                            <p>Biz quyidagi ma'lumotlarni to'playmiz:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <span className="text-white/80 font-bold">Shaxsiy ma'lumotlar:</span> ism va
                                    familiya, elektron pochta manzili (ro'yxatdan o'tishda yoki Google orqali kirishda)
                                </li>
                                <li>
                                    <span className="text-white/80 font-bold">O'yin ma'lumotlari:</span> yaratilgan
                                    quizlar, o'yin natijalari, ball va reyting ko'rsatkichlari, streak (ketma-ket
                                    faollik) va XP ballari
                                </li>
                                <li>
                                    <span className="text-white/80 font-bold">Texnik ma'lumotlar:</span> IP manzil,
                                    brauzer turi, operatsion tizim, sahifaga kirish vaqti va davomiyligi
                                </li>
                                <li>
                                    <span className="text-white/80 font-bold">To'lov ma'lumotlari:</span> Pro obuna
                                    uchun to'lov operatsiyalari uchinchi tomon xizmatlari (Payme, Click) orqali
                                    amalga oshiriladi; karta ma'lumotlari bizda saqlanmaydi
                                </li>
                            </ul>
                        </Section>

                        <Section title="3. Ma'lumotlardan foydalanish maqsadlari">
                            <p>To'plangan ma'lumotlar quyidagi maqsadlarda ishlatiladi:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Platformaga kirish va shaxsiy hisob boshqaruvi</li>
                                <li>Interaktiv o'yinlar va quizlarni to'g'ri ishlashini ta'minlash</li>
                                <li>Reyting jadvali va gamifikatsiya xususiyatlarini (XP, streak, badge) ko'rsatish</li>
                                <li>Platforma sifatini yaxshilash uchun anonim statistika tahlili</li>
                                <li>Xizmat shartlari buzilganda foydalanuvchi bilan bog'lanish</li>
                                <li>Pro obuna va to'lov tarixini boshqarish</li>
                            </ul>
                            <p className="mt-2">
                                Biz sizning ma'lumotlaringizni <span className="text-white/80 font-bold">reklama
                                maqsadlarida uchinchi tomonlarga sotmaymiz</span> va bermamiz.
                            </p>
                        </Section>

                        <Section title="4. Cookie siyosati">
                            <p>Zukkoo.uz quyidagi cookie'lardan foydalanadi:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <span className="text-white/80 font-bold">Zaruriy cookie'lar:</span> sessiya
                                    boshqaruvi va autentifikatsiya uchun (next-auth.session-token)
                                </li>
                                <li>
                                    <span className="text-white/80 font-bold">Funksional cookie'lar:</span> til
                                    afzalliklaringiz va interfeys sozlamalaringizni eslab qolish uchun
                                </li>
                                <li>
                                    <span className="text-white/80 font-bold">Tahlil cookie'lari:</span> anonim
                                    foydalanish statistikasi (Google Analytics, Vercel Analytics)
                                </li>
                            </ul>
                            <p>
                                Brauzer sozlamalari orqali cookie'larni o'chirib qo'yishingiz mumkin, lekin bu
                                platformaning ba'zi xususiyatlarini cheklashi mumkin.
                            </p>
                        </Section>

                        <Section title="5. Ma'lumotlarni saqlash">
                            <p>
                                Foydalanuvchi ma'lumotlari hisobingiz faol bo'lgan davr mobaynida saqlanadi.
                                Hisobni o'chirgach, shaxsiy ma'lumotlar <span className="text-white/80 font-bold">30
                                kun</span> ichida o'chiriladi. Anonim statistika ma'lumotlari uzoqroq saqlanishi mumkin.
                            </p>
                            <p>
                                Ma'lumotlar <span className="text-white/80 font-bold">Vercel</span> va
                                <span className="text-white/80 font-bold"> Supabase/PostgreSQL</span> serverlarda
                                (Yevropa hududida) shifrlanib saqlanadi.
                            </p>
                        </Section>

                        <Section title="6. Foydalanuvchi huquqlari">
                            <p>Siz quyidagi huquqlarga egasiz:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <span className="text-white/80 font-bold">Ko'rish:</span> profilingizda
                                    saqlangan barcha ma'lumotlarni ko'rish
                                </li>
                                <li>
                                    <span className="text-white/80 font-bold">O'zgartirish:</span> ism, email va
                                    parolingizni sozlamalar sahifasida yangilash
                                </li>
                                <li>
                                    <span className="text-white/80 font-bold">O'chirish:</span> hisobingizni to'liq
                                    o'chirish — bu barcha ma'lumotlarni qaytarib bo'lmaydigan tarzda o'chiradi
                                </li>
                                <li>
                                    <span className="text-white/80 font-bold">Eksport:</span> quizlaringiz
                                    ma'lumotlarini CSV formatida yuklab olish (dashboard → tahlil)
                                </li>
                            </ul>
                            <p>
                                Ushbu huquqlarni amalga oshirish uchun{' '}
                                <a href="mailto:info@zukkoo.uz" className="text-blue-400 hover:underline font-bold">
                                    info@zukkoo.uz
                                </a>{' '}
                                ga murojaat qiling.
                            </p>
                        </Section>

                        <Section title="7. Uchinchi tomon xizmatlari">
                            <p>Platforma quyidagi uchinchi tomon xizmatlaridan foydalanadi:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><span className="text-white/80 font-bold">Google OAuth</span> — hisobga kirish uchun</li>
                                <li><span className="text-white/80 font-bold">Vercel</span> — hosting va edge funksiyalar</li>
                                <li><span className="text-white/80 font-bold">Groq AI</span> — savol generatsiyasi (foydalanuvchi ma'lumotlari yuborilmaydi)</li>
                                <li><span className="text-white/80 font-bold">Payme / Click</span> — Pro obuna to'lovlari</li>
                            </ul>
                            <p>Har bir xizmat o'zining maxfiylik siyosatiga ega.</p>
                        </Section>

                        <Section title="8. Aloqa">
                            <p>
                                Maxfiylik siyosati bo'yicha savollar yoki shikoyatlar uchun:
                            </p>
                            <ul className="list-none space-y-2">
                                <li>📧 Email: <a href="mailto:info@zukkoo.uz" className="text-blue-400 hover:underline font-bold">info@zukkoo.uz</a></li>
                                <li>💬 Telegram: <a href="https://t.me/zukkoo_uz" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">@zukkoo_uz</a></li>
                                <li>🏛️ Tashkent axborot texnologiyalari universiteti (TATU), Toshkent, O'zbekiston</li>
                            </ul>
                        </Section>

                        {/* Footer note */}
                        <div
                            className="mt-8 pt-6 text-center text-white/20 text-xs font-semibold"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            Yangilangan: Aprel 2026 · Zukkoo.uz ·{' '}
                            <Link href={`/${params.locale}/terms`} className="hover:text-white/40 transition-colors">Foydalanish Shartlari</Link>
                        </div>
                    </div>
                </article>
            </main>
        </div>
    );
}
