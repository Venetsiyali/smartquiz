import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Built-in general questions always available
const BUILTIN: { subject: string; text: string; options: string[]; correctIndex: number; explanation?: string }[] = [
    // Matematika
    { subject: 'Matematika', text: '2 + 2 × 2 = ?', options: ['8', '6', '4', '2'], correctIndex: 1, explanation: 'Avval ko\'paytirish: 2×2=4, keyin qo\'shish: 2+4=6' },
    { subject: 'Matematika', text: 'Qaysi son tub son?', options: ['9', '15', '17', '21'], correctIndex: 2 },
    { subject: 'Matematika', text: '100 ning 25% i necha?', options: ['20', '25', '30', '40'], correctIndex: 1 },
    { subject: 'Matematika', text: 'Uchburchak ichki burchaklari yig\'indisi?', options: ['90°', '180°', '270°', '360°'], correctIndex: 1 },
    { subject: 'Matematika', text: '√144 = ?', options: ['11', '12', '13', '14'], correctIndex: 1 },
    { subject: 'Matematika', text: '5! (5 faktorial) = ?', options: ['25', '60', '100', '120'], correctIndex: 3, explanation: '5! = 5×4×3×2×1 = 120' },
    { subject: 'Matematika', text: 'Kvadratning perimetri 24 sm bo\'lsa, yuzasi qancha?', options: ['24 sm²', '36 sm²', '48 sm²', '16 sm²'], correctIndex: 1, explanation: 'Tomon = 24÷4 = 6 sm; yuza = 6² = 36 sm²' },

    // Fizika
    { subject: 'Fizika', text: 'Yorug\'lik tezligi taxminan necha km/s?', options: ['100 000', '200 000', '300 000', '400 000'], correctIndex: 2 },
    { subject: 'Fizika', text: 'Og\'irlik kuchining birligi?', options: ['Vatt', 'Nyuton', 'Joule', 'Paskal'], correctIndex: 1 },
    { subject: 'Fizika', text: 'Erkin tushish tezlanishi taxminan?', options: ['5 m/s²', '9,8 m/s²', '12 m/s²', '15 m/s²'], correctIndex: 1 },
    { subject: 'Fizika', text: 'Qaysi moddaning zichligi eng katta?', options: ['Temir', 'Oltin', 'Simob', 'Platina'], correctIndex: 3 },
    { subject: 'Fizika', text: 'Ohm qonuni qaysi formula?', options: ['I=U/R', 'U=I×R', 'R=U×I', 'Ikkalasi to\'g\'ri'], correctIndex: 3 },

    // Kimyo
    { subject: 'Kimyo', text: 'Suv molekulasining kimyoviy formulasi?', options: ['HO', 'H2O', 'H2O2', 'HO2'], correctIndex: 1 },
    { subject: 'Kimyo', text: 'Oltingugurt elementining belgisi?', options: ['Si', 'Se', 'S', 'Sr'], correctIndex: 2 },
    { subject: 'Kimyo', text: 'Kislotalar qanday ta\'m beradi?', options: ['Shirin', 'Achchiq', 'Nordon', 'Sho\'r'], correctIndex: 2 },
    { subject: 'Kimyo', text: 'Kimyoviy elementlar jadvalini kim yaratgan?', options: ['Nyuton', 'Mendeleev', 'Faradey', 'Kyuri'], correctIndex: 1 },
    { subject: 'Kimyo', text: 'Olmos qaysi elementdan tashkil topgan?', options: ['Kremniy', 'Azot', 'Uglerod', 'Kislorod'], correctIndex: 2 },

    // Biologiya
    { subject: 'Biologiya', text: 'Fotosintez qayerda amalga oshadi?', options: ['Ildizda', 'Xloroplastda', 'Mitoxondriyada', 'Yadroda'], correctIndex: 1 },
    { subject: 'Biologiya', text: 'Odam tanasida nechta suyak bor (katta odamda)?', options: ['106', '206', '306', '406'], correctIndex: 1 },
    { subject: 'Biologiya', text: 'DNK ning to\'liq nomi?', options: ['Dezoksiribonuklein kislota', 'Ribonuklein kislota', 'Dezoksiriboza kislota', 'Dinuklein kislota'], correctIndex: 0 },
    { subject: 'Biologiya', text: 'Hujayraning "energiya stantsiyasi" deb qaysi organoid ataladi?', options: ['Yadro', 'Xloroplast', 'Mitoxondriya', 'Lizosoma'], correctIndex: 2 },
    { subject: 'Biologiya', text: 'Qaysi vitamin yetishmasligida raxit kasalligi kelib chiqadi?', options: ['A vitamini', 'B12', 'C vitamini', 'D vitamini'], correctIndex: 3 },

    // Tarix
    { subject: 'Tarix', text: 'O\'zbekiston mustaqilligini qaysi yilda qo\'lga kiritdi?', options: ['1989', '1990', '1991', '1992'], correctIndex: 2 },
    { subject: 'Tarix', text: 'Amir Temur qayerda tug\'ilgan?', options: ['Samarqand', 'Buxoro', 'Kesh (Shahrisabz)', 'Toshkent'], correctIndex: 2 },
    { subject: 'Tarix', text: 'Ikkinchi jahon urushi qaysi yilda boshlangan?', options: ['1935', '1937', '1939', '1941'], correctIndex: 2 },
    { subject: 'Tarix', text: 'Muhammad al-Xorazmiy kim bo\'lgan?', options: ['Davlat arbobi', 'Matematik va astronom', 'Shoʻr', 'Shoʻro'], correctIndex: 1, explanation: 'Al-Xorazmiy IX asrda yashagan buyuk matematik — algebra fanining asoschisi' },
    { subject: 'Tarix', text: 'Qadimgi Misr hukmdorlari qanday nom bilan atalgan?', options: ['Qaysar', 'Fir\'avn', 'Xon', 'Shahansho'], correctIndex: 1 },

    // Geografiya
    { subject: 'Geografiya', text: 'Dunyo bo\'yicha eng uzun daryo?', options: ['Amazon', 'Nil', 'Yantszi', 'Mississipi'], correctIndex: 1 },
    { subject: 'Geografiya', text: 'O\'zbekistonning poytaxti?', options: ['Samarqand', 'Namangan', 'Toshkent', 'Buxoro'], correctIndex: 2 },
    { subject: 'Geografiya', text: 'Tinch okean qaysi okeanlardan katta?', options: ['Hind okeani', 'Atlantika okeani', 'Arktika okeani', 'Hammasi'], correctIndex: 3, explanation: 'Tinch okean barcha boshqa okeanlardan kattaroq' },
    { subject: 'Geografiya', text: 'O\'zbekiston nechta viloyatdan iborat?', options: ['12', '13', '14', '15'], correctIndex: 1 },
    { subject: 'Geografiya', text: 'Everest qaysi tog\' tizmasida joylashgan?', options: ['Tyanshan', 'Pomir', 'Gimalay', 'Qoʻhiston'], correctIndex: 2 },

    // O'zbek tili
    { subject: "O'zbek tili", text: 'O\'zbek alifbosida nechta harf bor (lotin)?', options: ['26', '28', '29', '32'], correctIndex: 2 },
    { subject: "O'zbek tili", text: 'Qaysi so\'z antonim juft?', options: ['Katta–ulkan', 'Baland–past', 'Go\'zal–chiroyli', 'Tez–shoshqin'], correctIndex: 1 },
    { subject: "O'zbek tili", text: '"Mehrob" so\'zida nechta harf?', options: ['5', '6', '7', '8'], correctIndex: 1 },
    { subject: "O'zbek tili", text: 'Qaysi so\'z ot turkumiga kiradi?', options: ['Chiroyli', 'Yugurmoq', 'Maktab', 'Tez'], correctIndex: 2 },

    // Ingliz tili
    { subject: 'Ingliz tili', text: '"Apple" so\'zining tarjimasi?', options: ['Olcha', 'Olma', 'Anor', 'Apelsin'], correctIndex: 1 },
    { subject: 'Ingliz tili', text: 'Ingliz tilida "Salom" qanday aytiladi?', options: ['Bonjour', 'Hola', 'Hello', 'Ciao'], correctIndex: 2 },
    { subject: 'Ingliz tili', text: '"I am going to school" - bu qaysi zamon?', options: ['Simple Past', 'Present Simple', 'Present Continuous', 'Future Simple'], correctIndex: 2 },

    // Informatika
    { subject: 'Informatika', text: '1 bayt necha bitdan iborat?', options: ['4', '8', '16', '32'], correctIndex: 1 },
    { subject: 'Informatika', text: 'WWW nimani anglatadi?', options: ['World Wide Web', 'Wide World Web', 'Web World Wide', 'World Web Wide'], correctIndex: 0 },
    { subject: 'Informatika', text: 'Qaysi dasturlash tili "python" deb ataladi?', options: ['Ilon nomi bilan', 'Yaratuvchi ismi bilan', 'Kompaniya nomi bilan', 'Shahar nomi bilan'], correctIndex: 0, explanation: 'Guido van Rossum BBC komediya seriali "Monty Python" sharafiga nomlagan' },
    { subject: 'Informatika', text: 'CPU nimaning qisqartmasi?', options: ['Central Processing Unit', 'Computer Power Unit', 'Central Program Unit', 'Core Processing Unit'], correctIndex: 0 },
];

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');

    // Try to fetch admin-added questions from LibraryQuiz
    let dbQuestions: { subject: string; text: string; options: string[]; correctIndex: number; explanation?: string }[] = [];
    try {
        const rows = await prisma.libraryQuiz.findMany({
            where: { game_type: 'Qishloq Bozori', is_active: true },
            select: { subject: true, questions: true },
        });
        for (const row of rows) {
            const qs = row.questions as any[];
            if (Array.isArray(qs)) {
                for (const q of qs) {
                    if (q.text && Array.isArray(q.options)) {
                        dbQuestions.push({
                            subject: row.subject,
                            text: q.text,
                            options: q.options,
                            correctIndex: q.correctIndex ?? 0,
                            explanation: q.explanation,
                        });
                    }
                }
            }
        }
    } catch { /* DB not available, use built-in only */ }

    const all = [...BUILTIN, ...dbQuestions];
    const filtered = subject && subject !== 'Barcha'
        ? all.filter(q => q.subject === subject)
        : all;

    // Group by subject
    const bySubject: Record<string, typeof all> = {};
    for (const q of filtered) {
        if (!bySubject[q.subject]) bySubject[q.subject] = [];
        bySubject[q.subject].push(q);
    }

    const subjects = [...new Set(all.map(q => q.subject))];

    return NextResponse.json({ questions: filtered, bySubject, subjects, total: filtered.length });
}
