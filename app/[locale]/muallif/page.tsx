import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Muallif haqida | Rustamjon Nasridinov',
    description: 'TATU tayanch doktoranti va PhD tadqiqotchisi Rustamjon Nasridinovning ilmiy faoliyati, ORCID, Web of Science, Scopus va Google Scholar profillari, Zukkoo.uz loyihasi haqida.',
    alternates: {
        canonical: 'https://www.zukkoo.uz/uz/muallif',
    },
    openGraph: {
        title: 'Loyiha muallifi: Rustamjon Nasridinov — PhD Researcher at TUIT',
        description: 'TATU tayanch doktoranti, Alpen-Adria University Klagenfurt Double Degree bitiruvchisi. Ilmiy yo\'nalish: gidrologik monitoring, gibrid modellar, AI va raqamli ta\'lim.',
        images: ['/images/author.jpg'],
        type: 'profile',
    },
};

// Ilmiy identifikatorlar — Google sameAs uchun ham ishlatiladi
const SCIENTIFIC_LINKS = [
    {
        name: 'ORCID',
        url: 'https://orcid.org/0009-0003-2422-9029',
        handle: '0009-0003-2422-9029',
        color: '#A6CE39',
        bg: 'rgba(166,206,57,0.1)',
        border: 'rgba(166,206,57,0.4)',
    },
    {
        name: 'Google Scholar',
        url: 'https://scholar.google.com/scholar?q=Nasridinov+Rustamjon',
        handle: 'Nasridinov Rustamjon',
        color: '#4285F4',
        bg: 'rgba(66,133,244,0.1)',
        border: 'rgba(66,133,244,0.4)',
    },
    {
        name: 'Web of Science',
        url: 'https://www.webofscience.com/wos/author/record/POV-2913-2026',
        handle: 'ResearcherID: POS-8883-2026',
        color: '#5E33BF',
        bg: 'rgba(94,51,191,0.1)',
        border: 'rgba(94,51,191,0.4)',
    },
    {
        name: 'ResearchGate',
        url: 'https://www.researchgate.net/profile/Rustamjon-Nasridinov',
        handle: 'Rustamjon-Nasridinov',
        color: '#00CCBB',
        bg: 'rgba(0,204,187,0.1)',
        border: 'rgba(0,204,187,0.4)',
    },
    {
        name: 'LinkedIn',
        url: 'https://www.linkedin.com/in/venetsiyalik',
        handle: '/in/venetsiyalik',
        color: '#0A66C2',
        bg: 'rgba(10,102,194,0.1)',
        border: 'rgba(10,102,194,0.4)',
    },
    {
        name: 'Scopus',
        url: 'https://www.scopus.com/authid/detail.uri?authorId=Nasridinov+Rustamjon',
        handle: 'Elsevier Scopus',
        color: '#E9711C',
        bg: 'rgba(233,113,28,0.1)',
        border: 'rgba(233,113,28,0.4)',
    },
    {
        name: 'Springer Nature',
        url: 'https://link.springer.com/search?query=Nasridinov+Rustamjon',
        handle: 'Nature / Springer',
        color: '#6BB9A4',
        bg: 'rgba(107,185,164,0.1)',
        border: 'rgba(107,185,164,0.4)',
    },
    {
        name: 'SLIB.UZ',
        url: 'https://slib.uz/',
        handle: "O'zbekiston ilmiy bazasi",
        color: '#1E88E5',
        bg: 'rgba(30,136,229,0.1)',
        border: 'rgba(30,136,229,0.4)',
    },
    {
        name: 'Antiplag.uz',
        url: 'https://antiplag.uz/',
        handle: "Milliy plagiat bazasi",
        color: '#D32F2F',
        bg: 'rgba(211,47,47,0.1)',
        border: 'rgba(211,47,47,0.4)',
    },
];

export default function AuthorPage() {
    // Person JSON-LD with sameAs for all scientific profiles (E-E-A-T + sameAs signal)
    const personJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Rustamjon Nasridinov',
        alternateName: 'Nasridinov Rustamjon',
        jobTitle: 'PhD Researcher, Stajyor-o\'qituvchi',
        description: "TATU 1-bosqich tayanch doktoranti va \"Axborot ta'lim texnologiyalari\" kafedrasi stajyor-o'qituvchisi. Alpen-Adria University Klagenfurt (Avstriya) va TATU o'rtasidagi Double Degree magistratura dasturi bitiruvchisi.",
        image: 'https://www.zukkoo.uz/images/author.jpg',
        url: 'https://www.zukkoo.uz/uz/muallif',
        affiliation: [
            {
                '@type': 'CollegeOrUniversity',
                name: 'Muhammad al-Xorazmiy nomidagi Toshkent axborot texnologiyalari universiteti (TATU)',
                url: 'https://tuit.uz',
            },
            {
                '@type': 'CollegeOrUniversity',
                name: 'Alpen-Adria-Universität Klagenfurt',
                url: 'https://www.aau.at',
            },
        ],
        knowsAbout: [
            'Gidrologik monitoring',
            'Gibrid modellar',
            "Sun'iy intellekt",
            "Raqamli ta'lim texnologiyalari",
            'Intellektual axborot tizimlari',
            'Gamifikatsiya',
        ],
        sameAs: SCIENTIFIC_LINKS.map(link => link.url),
    };

    return (
        <div className="relative min-h-screen bg-[#0a0f25] text-white overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Person JSON-LD for E-E-A-T & sameAs signal */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
            />

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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/author.jpg"
                            alt="Rustamjon Nasridinov — PhD Researcher at TUIT"
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#0a0f25] bg-white/5"
                        />
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 pb-2">
                        Rustamjon Nasridinov
                    </h1>
                    <h2 className="text-lg md:text-xl font-medium tracking-wide text-white/70">
                        TATU Tayanch Doktoranti | PhD Researcher | Full-Stack Dasturchi
                    </h2>
                    <p className="max-w-2xl mx-auto text-white/60 text-base md:text-lg leading-relaxed mt-6">
                        Toshkent axborot texnologiyalari universiteti (TATU) <strong className="text-white/80">1-bosqich tayanch doktoranti</strong> va <strong className="text-white/80">&quot;Axborot ta&apos;lim texnologiyalari&quot; kafedrasi stajyor-o&apos;qituvchisi</strong>. Alpen-Adria University Klagenfurt (Avstriya) va TATU o&apos;rtasidagi <strong className="text-white/80">Double Degree magistratura dasturi bitiruvchisi</strong> (ICT yo&apos;nalishi). Ilmiy yo&apos;nalish: gidrologik monitoring, gibrid modellar, sun&apos;iy intellekt va raqamli ta&apos;lim texnologiyalari.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

                    {/* Academic Journey */}
                    <section className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <span className="text-2xl">🎓</span> Academic Journey
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-[#0a0f25] flex items-center justify-center text-xl shadow-inner shadow-white/10 shrink-0">🏛️</div>
                                <div>
                                    <h4 className="font-bold text-blue-300">TATU — Tayanch Doktoranti (PhD)</h4>
                                    <p className="text-sm text-white/60 leading-relaxed">
                                        1-bosqich tayanch doktoranti. &quot;Axborot ta&apos;lim texnologiyalari&quot; kafedrasi stajyor-o&apos;qituvchisi.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-[#0a0f25] flex items-center justify-center text-xl shadow-inner shadow-white/10 shrink-0">🌍</div>
                                <div>
                                    <h4 className="font-bold text-red-300">Double Degree — AAU Klagenfurt × TATU</h4>
                                    <p className="text-sm text-white/60 leading-relaxed">
                                        Alpen-Adria University Klagenfurt (Avstriya) va TATU o&apos;rtasidagi Double Degree magistratura dasturi bitiruvchisi. ICT (Information and Communication Technologies) yo&apos;nalishi.
                                    </p>
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
                                <h4 className="text-xs font-bold text-purple-300 mb-2 font-mono uppercase tracking-wider">PhD Dissertatsiyasi</h4>
                                <p className="text-white/80 leading-relaxed font-medium text-sm">
                                    &quot;Vaqtli qatorlarda gidrologik ko&apos;rsatkichlar dinamikasini monitoring qilishning gibrid modellari va intellektual axborot tizimi&quot;
                                </p>
                            </div>
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                <h4 className="text-xs font-bold text-indigo-300 mb-2 font-mono uppercase tracking-wider">Asosiy yo&apos;nalishlar</h4>
                                <ul className="text-sm text-white/60 leading-relaxed space-y-1 list-disc pl-5">
                                    <li>Gidrologik monitoring va gibrid modellar</li>
                                    <li>Sun&apos;iy intellekt (AI/ML)</li>
                                    <li>Raqamli ta&apos;lim texnologiyalari</li>
                                    <li>Intellektual axborot tizimlari</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ═══════════ ILMIY IDENTIFIKATORLAR BLOKI (Scientific Identifiers) ═══════════ */}
                <section className="glass p-8 md:p-10 rounded-3xl border border-white/5 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full"></div>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full"></div>

                    <div className="text-center mb-8 relative z-10">
                        <h3 className="text-2xl md:text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                            Ilmiy faoliyat va identifikatorlar
                        </h3>
                        <p className="text-white/50 text-sm font-medium max-w-2xl mx-auto">
                            Xalqaro va milliy ilmiy bazalarda tasdiqlangan profillar. Har bir identifikator mualliflik va ilmiy mansubiyatni tasdiqlaydi.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 relative z-10">
                        {SCIENTIFIC_LINKS.map((link) => (
                            <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="me author noopener noreferrer"
                                title="PhD researcher at TUIT"
                                aria-label={`${link.name} — PhD researcher at TUIT`}
                                className="group flex flex-col items-center gap-3 p-5 rounded-2xl transition-all hover:scale-105 hover:-translate-y-1"
                                style={{
                                    background: link.bg,
                                    border: `1px solid ${link.border}`,
                                }}
                            >
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 transition-transform group-hover:scale-110"
                                    style={{
                                        background: link.bg,
                                        color: link.color,
                                        border: `2px solid ${link.border}`,
                                    }}
                                >
                                    {link.name === 'ORCID' && (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722h-2.222z" /></svg>
                                    )}
                                    {link.name === 'Google Scholar' && (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z" /></svg>
                                    )}
                                    {link.name === 'Web of Science' && (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                    )}
                                    {link.name === 'ResearchGate' && (
                                        <svg viewBox="0 0 32 32" fill="currentColor" className="w-7 h-7"><path d="M12.922 23.375h-2.188v-12h4.531c3.094 0 5.094 1.25 5.094 3.75 0 2.125-1.531 3.25-3.375 3.531l4.031 4.719h-2.594l-3.563-4.344h-1.938v4.344zM12.922 17.5h2.188c2 0 3.094-1 3.094-2.313s-1.094-2.188-2.906-2.188h-2.375v4.5zM30.438 10.375v13h-4.094v-7.313c0-1.875-.781-2.906-2.188-2.906-1.594 0-2.438 1.156-2.438 2.906v7.313h-4.063v-13h3.813v1.656c.844-1.281 2.219-2.031 3.844-2.031 2.875 0 5.125 1.781 5.125 5.375z" /></svg>
                                    )}
                                    {link.name === 'LinkedIn' && (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                    )}
                                    {link.name === 'Scopus' && (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><circle cx="12" cy="12" r="10" fillOpacity="0.2"/><text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="900" fill="currentColor">Sc</text></svg>
                                    )}
                                    {link.name === 'Springer Nature' && (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M12 2L2 22h20L12 2zm0 5l6.5 13H5.5L12 7z"/></svg>
                                    )}
                                    {link.name === 'SLIB.UZ' && (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M4 4h16v2H4zm0 4h16v12H4V8zm2 2v8h12v-8H6zm2 2h8v1H8v-1zm0 3h8v1H8v-1z"/></svg>
                                    )}
                                    {link.name === 'Antiplag.uz' && (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v4h-2V7zm0 6h2v2h-2v-2z"/></svg>
                                    )}
                                </div>
                                <div className="text-center">
                                    <div className="font-black text-sm text-white leading-tight">{link.name}</div>
                                    <div className="text-[10px] text-white/40 font-semibold mt-1 truncate max-w-[120px]" title={link.handle}>{link.handle}</div>
                                </div>
                            </a>
                        ))}
                    </div>

                    <div className="text-center mt-8 text-xs text-white/30 font-medium relative z-10">
                        <span className="inline-flex items-center gap-2">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.84L19.53 19H4.47L12 5.84zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
                            Barcha havolalar <code className="bg-white/5 px-1 rounded">rel=&quot;me author&quot;</code> bilan tasdiqlangan
                        </span>
                    </div>
                </section>

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
