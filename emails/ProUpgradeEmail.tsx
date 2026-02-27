import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ProUpgradeEmailProps {
    name: string;
}

export const ProUpgradeEmail = ({ name }: ProUpgradeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Tabriklaymiz! Siz Zukkoo PRO obunasiga ega bo'ldingiz! 👑</Preview>
            <Tailwind>
                <Body className="bg-gray-100 font-sans my-auto mx-auto p-4 text-gray-900">
                    <Container className="bg-white border border-gray-200 rounded-2xl shadow-lg mt-[40px] mx-auto p-8 max-w-[500px]">
                        <Section className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl font-black text-white shadow-md mb-4 border border-yellow-300">
                                👑
                            </div>
                            <Heading className="text-3xl font-bold text-gray-900 mx-0 mt-0 mb-4 p-0">
                                PRO statusi qutlug' bo'lsin, <br /> {name}!
                            </Heading>
                        </Section>

                        <Text className="text-base leading-[24px] text-gray-700 mb-6 text-center">
                            Ajoyib qaror! Siz xaridingiz doirasida endi <strong>Zukkoo PRO</strong> obunasining barcha premium xizmatlaridan foydalana olasiz.
                        </Text>

                        <Section className="bg-yellow-50 rounded-xl p-6 mb-6 border border-yellow-100">
                            <Text className="text-base font-bold text-gray-800 m-0 mb-4 text-center">
                                Sizning yangi imkoniyatlaringiz:
                            </Text>
                            <ul className="text-base text-gray-700 list-none p-0 m-0 space-y-3">
                                <li className="flex items-center gap-2">🔥 <strong>Cheksiz o'yinchilar:</strong> O'yinlaringizga xohlagancha odam qo'sha olasiz.</li>
                                <li className="flex items-center gap-2">📊 <strong>Chuqur Analitika:</strong> O'quvchilar natijalarinii saqlash va tekshirish.</li>
                                <li className="flex items-center gap-2">🤖 <strong>Kengaytirilgan AI:</strong> Sun'iy intellekt orqali yuzlab noyob savollar generatsiyasi qilish cheklovi olib tashlandi.</li>
                                <li className="flex items-center gap-2">👑 <strong>To'liq PRO Rejimlar:</strong> Dars davomida maxsus musobaqa uslublaridan doimiy foydalanish huquqi.</li>
                            </ul>
                        </Section>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Link
                                href="https://zukkoo.uz/dashboard"
                                className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl text-white text-[16px] font-semibold no-underline text-center px-6 py-4 block hover:opacity-90 transition-opacity"
                            >
                                Boshqaruv Paneliga O'tish
                            </Link>
                        </Section>

                        <Text className="text-sm leading-[24px] text-gray-500 mt-8 text-center border-t border-gray-200 pt-8">
                            Agar sizda biron bir savol tug'ilsa, biz bilan bog'lanishdan tortinmang.
                            <br /><br />
                            Zukkoo Premium Jamoasi, 2026.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ProUpgradeEmail;
