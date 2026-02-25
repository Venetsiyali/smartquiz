import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Muallif haqida | Rustamjon Nasridinov',
    description: 'TATU o\'qituvchisi va PhD tadqiqotchisi Rustamjon Nasridinovning ilmiy faoliyati va Zukkoo.uz loyihasi haqida.',
    openGraph: {
        title: 'Loyiha muallifi: Rustamjon Nasridinov',
        description: 'TATU o\'qituvchisi va PhD tadqiqotchisi Rustamjon Nasridinovning ilmiy faoliyati va Zukkoo.uz loyihasi haqida.',
        images: ['/og-image.jpg'],
    },
};

export default function AuthorPage() {
    return (
        <div className="relative min-h-screen bg-[#0a0f25] text-white overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Background Data Streams Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-1/4 w-[2px] h-[120%] bg-gradient-to-b from-transparent via-blue-500 to-transparent animate-data-stream" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
                <div className="absolute top-[-20%] left-2/4 w-[1px] h-[140%] bg-gradient-to-b from-transparent via-purple-500 to-transparent animate-data-stream" style={{ animationDelay: '1.5s', animationDuration: '4s' }}></div>
                <div className="absolute top-[-15%] right-1/4 w-[2px] h-[130%] bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-data-stream" style={{ animationDelay: '0.7s', animationDuration: '2.5s' }}></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12">

                {/* Back button */}
                <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 group">
                    <span className="text-xl transform group-hover:-translate-x-1 transition-transform">←</span>
                    <span className="font-bold tracking-wider text-sm uppercase">Asosiy sahifaga</span>
                </Link>

                {/* Header Section */}
                <header className="text-center space-y-4 animate-fade-in-up">
                    <div className="inline-block p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        <img
                            src="https://avatars.githubusercontent.com/u/1?v=4"
                            alt="Rustamjon Nasridinov"
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#0a0f25]"
                            onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231e293b"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif">RN</text></svg>' }}
                        />
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 pb-2">
                        Rustamjon Nasridinov
                    </h1>
                    <h2 className="text-lg md:text-xl font-medium tracking-wide text-white/70">
                        TATU o'qituvchisi | PhD Tadqiqotchi | Fullck-Stack Dasturchi
                    </h2>
                    <p className="max-w-2xl mx-auto text-white/60 text-base md:text-lg leading-relaxed mt-6">
                        Men Toshkent axborot texnologiyalari universiteti (TATU) "Axborot va ta'lim texnologiyalari" kafedrasi stajyor-o'qituvchisi hamda tayanch doktorantiman. Mening ilmiy faoliyatim zamonaviy axborot tizimlari va ta'lim texnologiyalarining integratsiyasiga bag'ishlangan.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

                    {/* Academic Journey */}
                    <section className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <span className="text-2xl">🎓</span> Academic Journey
                        </h3>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent hidden"></div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-[#0a0f25] flex items-center justify-center text-xl shadow-inner shadow-white/10 shrink-0">🏛️</div>
                                <div>
                                    <h4 className="font-bold text-blue-300">TATU</h4>
                                    <p className="text-sm text-white/60">Axborot va ta'lim texnologiyalari kafedrasi stajyor-o'qituvchisi</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-[#0a0f25] flex items-center justify-center text-xl shadow-inner shadow-white/10 shrink-0">🌐</div>
                                <div>
                                    <h4 className="font-bold text-red-300">Klagenfurt Universiteti (AAU)</h4>
                                    <p className="text-sm text-white/60">Xalqaro talaba, Avstriya. Innovatsion metodikalarni o'rganish va mahalliy ta'lim tizimiga tadbiq etish</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Research Focus */}
                    <section className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full group-hover:bg-purple-500/20 transition-all"></div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <span className="text-2xl">🔬</span> Research Focus
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                <h4 className="text-lg font-bold text-purple-300 mb-2 font-mono text-sm uppercase tracking-wider">PhD Dissertatsiyasi</h4>
                                <p className="text-white/80 leading-relaxed font-medium">
                                    "Vaqtli qatorlarda gidrologik ko'rsatkichlar dinamikasini monitoring qilishning gibrid modellari va intellektual axborot tizimi"
                                </p>
                            </div>
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                <h4 className="text-lg font-bold text-indigo-300 mb-2 font-mono text-sm uppercase tracking-wider">Smart Education</h4>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    Zukkoo.uz va boshqa platformalar orqali talabalar qiziqishini oshirish va intellektual monitoring qilish.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Achievements */}
                <section className="glass p-8 md:p-10 rounded-3xl border border-white/5 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full"></div>
                    <h3 className="text-2xl font-black mb-8 text-center">Yutuqlar va Loyihalar</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col items-center text-center p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                            <div className="text-4xl mb-4">🏆</div>
                            <h4 className="font-bold text-green-400 mb-2">Agrobank AI500!</h4>
                            <p className="text-sm text-white/60">Hackathon 2025 finalchisi va maxsus sertifikat sohibi.</p>
                        </div>

                        <div className="flex flex-col items-center text-center p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                            <div className="text-4xl mb-4">💻</div>
                            <h4 className="font-bold text-blue-400 mb-2">Platformalar Muallifi</h4>
                            <p className="text-sm text-white/60">Zukkoo.uz, Eco-Balance Edu XR va S-STUDY loyihalari asoschisi va dasturchisi.</p>
                        </div>

                        <div className="flex flex-col items-center text-center p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                            <div className="text-4xl mb-4">📚</div>
                            <h4 className="font-bold text-purple-400 mb-2">Ilmiy Nashrlar</h4>
                            <p className="text-sm text-white/60">Raqamli texnologiyalar va pedagogika sohasidagi o'quv qo'llanmalar va ilmiy maqolalar muallifi.</p>
                        </div>
                    </div>
                </section>

                {/* Scientific Links */}
                <section className="text-center space-y-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <h3 className="text-xl text-white/50 font-bold uppercase tracking-widest text-sm">Ilmiy maqolalar va nashrlar</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="https://scholar.google.com/citations?user=yourGoogleScholarID" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-[#e8eaed] text-[#4285F4] font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(66,133,244,0.2)]">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z" /></svg>
                            Google Scholar
                        </a>
                        <a href="https://www.researchgate.net/profile/Rustamjon-Nasridinov" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-[#00ccbb] text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,204,187,0.2)]">
                            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="currentColor"><path d="M12.922 23.375h-2.188v-12h4.531c3.094 0 5.094 1.25 5.094 3.75 0 2.125-1.531 3.25-3.375 3.531l4.031 4.719h-2.594l-3.563-4.344h-1.938v4.344zM12.922 17.5h2.188c2 0 3.094-1 3.094-2.313s-1.094-2.188-2.906-2.188h-2.375v4.5zM30.438 10.375v13h-4.094v-7.313c0-1.875-.781-2.906-2.188-2.906-1.594 0-2.438 1.156-2.438 2.906v7.313h-4.063v-13h3.813v1.656c.844-1.281 2.219-2.031 3.844-2.031 2.875 0 5.125 1.781 5.125 5.375z" /></svg>
                            ResearchGate
                        </a>
                    </div>
                </section>

                <footer className="text-center pt-8 border-t border-white/5 text-white/30 text-xs">
                    <p>© {new Date().getFullYear()} Zukkoo.uz — Barcha huquqlar himoyalangan.</p>
                </footer>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes data-stream {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                .animate-data-stream {
                    animation-name: data-stream;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                }
            `}} />
        </div>
    );
}
