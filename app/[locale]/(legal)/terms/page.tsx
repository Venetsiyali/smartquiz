import { Metadata } from 'next';
import Header from '@/components/Header';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    return {
        title: "Foydalanish Shartlari | Zukkoo.uz",
        description: "Zukkoo.uz platformasidan foydalanish shartlari va qoidalari. O'zbekiston qonunchiligiga mos huquqiy hujjat.",
        alternates: {
            canonical: `https://www.zukkoo.uz/${params.locale}/terms`,
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

export default function TermsPage({ params }: { params: { locale: string } }) {
    return (
        <div className="bg-landing min-h-screen flex flex-col text-white">
            <Header />

            <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-12 md:px-8">
                <article className="w-full max-w-3xl">
                    {/* Header */}
                    <div className="mb-10">
                        <p className="text-white/30 text-xs font-black tracking-widest uppercase mb-2">Huquqiy hujjat</p>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">📋 Foydalanish Shartlari</h1>
                        <p className="text-white/40 text-sm font-semibold">
                            Oxirgi yangilanish: <span className="text-white/60">Aprel 2026</span>
                        </p>
                    </div>

                    {/* Card */}
                    <div
                        className="rounded-3xl p-8 md:p-10"
                        style={{ background: 'rgba(10,14,30,0.8)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                    >
                        <Section title="1. Umumiy shartlar">
                            <p>
                                Ushbu Foydalanish Shartlari (keyingi o'rinlarda "Shartlar") Zukkoo.uz platformasi
                                (zukkoo.uz, "Platforma") va siz (foydalanuvchi) o'rtasidagi munosabatlarni tartibga
                                soladi. Platformadan foydalanish orqali siz ushbu shartlarni to'liq qabul qilasiz.
                            </p>
                            <p>
                                Agar siz ushbu shartlarga rozi bo'lmasangiz, platformadan foydalanmang.
                            </p>
                            <p>
                                Platforma O'zbekiston Respublikasi qonunchiligiga muvofiq ishlaydi. Barcha nizolar
                                O'zbekiston Respublikasi sudlari orqali hal etiladi.
                            </p>
                        </Section>

                        <Section title="2. Ro'yxatdan o'tish va hisob">
                            <p>
                                Platformadan to'liq foydalanish uchun ro'yxatdan o'tish talab etiladi. Siz quyidagilarni
                                ta'minlashingiz shart:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Haqiqiy va to'g'ri ma'lumotlarni kiritish</li>
                                <li>Hisobingiz xavfsizligini ta'minlash (parolingizni maxfiy saqlash)</li>
                                <li>Hisob ma'lumotlaringizni boshqa shaxslarga bermaslik</li>
                                <li>Hisob buzilishi yoki ruxsatsiz kirish aniqlanganda darhol xabardor qilish</li>
                            </ul>
                            <p>
                                Platforma xizmat sifatini ta'minlash uchun bir shaxsga bir hisob ruxsat etadi.
                            </p>
                        </Section>

                        <Section title="3. Foydalanuvchi majburiyatlari">
                            <p>Platformadan foydalanishda siz quyidagilarga rozilik bildirasiz:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Platformadan faqat qonuniy va ta'limiy maqsadlarda foydalanish</li>
                                <li>Boshqa foydalanuvchilarning huquqlarini hurmat qilish</li>
                                <li>Yaratilgan kontent (quizlar va savollar) uchun shaxsan javobgarlik olish</li>
                                <li>Platformaning texnik ishlashiga zarar yetkazmaslik</li>
                                <li>Boshqa foydalanuvchilar haqida yolg'on yoki zararli kontent yaratmaslik</li>
                            </ul>
                        </Section>

                        <Section title="4. Kontentga egalik huquqi">
                            <p>
                                <span className="text-white/80 font-bold">Siz yaratgan quizlar</span> (savollar,
                                javoblar, ta'riflar) sizning intellektual mulkingiz hisoblanadi. Platforma sizning
                                kontent ma'lumotlarini uchinchi tomonlarga sotmaydi.
                            </p>
                            <p>
                                Biroq, quizni <span className="text-white/80 font-bold">"Ochiq" (public)</span>{' '}
                                deb belgilash orqali siz boshqa foydalanuvchilarga uni ko'rish va o'ynash imkonini
                                berasiz. Ochiq quizlar platformaning umumiy kutubxonasida paydo bo'lishi mumkin.
                            </p>
                            <p>
                                <span className="text-white/80 font-bold">Platforma interfeysi, logotipi, dizayni
                                va kodi</span> — Zukkoo.uz intellektual mulki bo'lib, ruxsatsiz nusxa ko'chirish
                                taqiqlanadi.
                            </p>
                        </Section>

                        <Section title="5. Bepul va Pro tarif rejalari">
                            <p>
                                Zukkoo.uz ikki tarif rejasini taklif etadi:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <span className="text-white/80 font-bold">Bepul tarif:</span> asosiy funksiyalar,
                                    cheklangan miqdordagi quizlar yaratish, barcha o'yin turlarini sinab ko'rish
                                </li>
                                <li>
                                    <span className="text-white/80 font-bold">Pro tarif:</span> cheklanmagan quizlar,
                                    qo'shimcha o'yin turlari, AI orqali savol generatsiyasi, batafsil statistika
                                </li>
                            </ul>
                            <p>
                                Pro obuna oylik yoki yillik to'lov asosida ta'minlanadi. To'lov Payme yoki Click
                                orqali amalga oshiriladi.
                            </p>
                            <p>
                                <span className="text-white/80 font-bold">Bekor qilish:</span> Pro obunani istalgan
                                vaqtda bekor qilishingiz mumkin. Joriy to'lov davri tugaguncha xizmatdan
                                foydalanishda davom etasiz. Qaytarish (refund) faqat texnik nosozliklar holatida
                                ko'rib chiqiladi.
                            </p>
                        </Section>

                        <Section title="6. Taqiqlangan xatti-harakatlar">
                            <p>Quyidagi harakatlar qat'iyan taqiqlanadi:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Platformaga avtomatik bot yoki skript orqali kirtish (DDoS, spam)</li>
                                <li>Boshqa foydalanuvchilarning hisob ma'lumotlarini olishga urinish</li>
                                <li>Platformaning API yoki ma'lumotlar bazasiga ruxsatsiz kirish</li>
                                <li>Nafrat, kamsitish, zo'ravonlik yoki noqonuniy kontent yaratish</li>
                                <li>Plagiat kontent (mualliflik huquqi himoyalangan materiallarni ruxsatsiz joylashtirish)</li>
                                <li>Boshqa foydalanuvchilarni aldash, harassing qilish yoki ularning o'yin natijalarini buzish</li>
                                <li>Platforma kodini qayta muhandislik qilish (reverse engineering)</li>
                            </ul>
                            <p>
                                Ushbu qoidalar buzilsa, hisob darhol bloklash huquqi saqlanadi.
                            </p>
                        </Section>

                        <Section title="7. Javobgarlik cheklovi">
                            <p>
                                Zukkoo.uz platforma "borligicha" (as-is) taqdim etiladi. Biz quyidagilar uchun
                                javobgar emasmiz:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Foydalanuvchi yaratgan kontent aniqligi va sifati</li>
                                <li>Internet ulanishi yoki server nosozliklari natijasida yuzaga kelgan uzilishlar</li>
                                <li>Foydalanuvchi tomonidan kiritilgan noto'g'ri ma'lumotlar oqibatlari</li>
                                <li>Uchinchi tomon xizmatlari (Google, Payme, Click) ishlash sifati</li>
                            </ul>
                            <p>
                                Platforma barqarorligini ta'minlash uchun muntazam yangilanishlar va texnik xizmat
                                ko'rsatish amalga oshiriladi.
                            </p>
                        </Section>

                        <Section title="8. Shartlarga o'zgartirishlar">
                            <p>
                                Zukkoo.uz ushbu shartlarni o'zgartirish huquqini o'zida saqlab qoladi. Muhim
                                o'zgartirishlar haqida foydalanuvchilar elektron pochta yoki platforma ichida
                                xabardor qilinadi.
                            </p>
                            <p>
                                Yangilangan shartlar e'lon qilinganidan <span className="text-white/80 font-bold">7
                                kun</span> o'tgach kuchga kiradi. Platformadan foydalanishda davom etish yangi
                                shartlarni qabul qilganlik sifatida qaraladi.
                            </p>
                        </Section>

                        <Section title="9. Aloqa">
                            <p>
                                Foydalanish shartlari bo'yicha savollar yoki e'tirozlar uchun:
                            </p>
                            <ul className="list-none space-y-2">
                                <li>📧 Email: <a href="mailto:info@zukkoo.uz" className="text-blue-400 hover:underline font-bold">info@zukkoo.uz</a></li>
                                <li>💬 Telegram: <a href="https://t.me/zukkoo_uz" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">@zukkoo_uz</a></li>
                            </ul>
                        </Section>

                        {/* Footer note */}
                        <div
                            className="mt-8 pt-6 text-center text-white/20 text-xs font-semibold"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            Yangilangan: Aprel 2026 · Zukkoo.uz ·{' '}
                            <Link href={`/${params.locale}/privacy`} className="hover:text-white/40 transition-colors">Maxfiylik Siyosati</Link>
                        </div>
                    </div>
                </article>
            </main>
        </div>
    );
}
