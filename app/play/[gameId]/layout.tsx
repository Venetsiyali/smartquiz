import { Metadata } from 'next';

const GAME_CONFIG: Record<string, { name: string; sub: string; image: string; desc: string }> = {
    '1': { name: 'Zukkoo', sub: 'Klassik viktorina', image: '/images/games/1.webp', desc: "Ko'p tanlov va To'g'ri/Noto'g'ri savollar asosidagi klassik real-vaqt viktorina. Eng tez javob bergan — eng ko'p ball yig'adi!" },
    '2': { name: 'Mantiqiy zanjir', sub: 'Sorting Game', image: '/images/games/2.webp', desc: "Elementlarni to'g'ri mantiqiy tartibda qayta joylashtiring. Algoritmik fikrlash va tezkorlikni birlashtirgan noyob format!" },
    '3': { name: 'Terminlar jangi', sub: 'Matching Game', image: '/images/games/3.webp', desc: "Terminlar va ta'riflarni mos juftlarga ulang. Bilimlarni vizual tarzda sinab ko'rish uchun mukammal format!" },
    '4': { name: 'Bliz-Sohat', sub: 'True/False Duel', image: '/images/games/4.webp', desc: "To'g'ri yoki noto'g'ri — bir soniya ichida qaror qil! Eng tez refleksli o'yinchi g'alaba qozonadi!" },
    '5': { name: 'Yashirin kod', sub: 'Anagram', image: '/images/games/5.webp', desc: "Aralashtirilgan harflardan yashirin so'zni kashf eting. Kriptografik mantiq va so'z boyligi ham muhim!" },
    '6': { name: 'Jamoaviy qutqaruv', sub: 'Team Mode', image: '/images/games/6.webp', desc: "Jamoaviy kuchni birlashtiring! Combo combo ko'paysin, qalqon ishlat, raqiblarni g'alaba poyoniga yetmay to'xtat!" },
};

export async function generateMetadata({ params }: { params: { gameId: string } }): Promise<Metadata> {
    const game = GAME_CONFIG[params.gameId];
    if (!game) return { title: 'O\'yin topilmadi | Zukkoo.uz' };

    return {
        title: `${game.name} — ${game.sub}`,
        description: game.desc,
        openGraph: {
            title: `${game.name} — ${game.sub} | Zukkoo.uz`,
            description: game.desc,
            url: `https://zukkoo.uz/play/${params.gameId}`,
            images: [
                {
                    url: `https://zukkoo.uz${game.image}`,
                    width: 1200,
                    height: 630,
                    alt: game.name,
                }
            ],
            type: 'website',
            locale: 'uz_UZ',
            siteName: 'Zukkoo Platformasi',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${game.name} | Zukkoo.uz`,
            description: game.desc,
            images: [`https://zukkoo.uz${game.image}`],
        }
    };
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
