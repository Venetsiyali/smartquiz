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

interface WelcomeEmailProps {
    name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Zukkoo platformasiga xush kelibsiz!</Preview>
            <Tailwind>
                <Body className="bg-gray-100 font-sans my-auto mx-auto p-4 text-gray-900">
                    <Container className="bg-white border border-gray-200 rounded-2xl shadow-lg mt-[40px] mx-auto p-8 max-w-[500px]">
                        <Section className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-md mb-4">
                                Z
                            </div>
                            <Heading className="text-3xl font-bold text-gray-900 mx-0 mt-0 mb-4 p-0">
                                Xush kelibsiz, {name}! 🎉
                            </Heading>
                        </Section>

                        <Text className="text-base leading-[24px] text-gray-700 mb-6">
                            Sizni <strong>Zukkoo.uz</strong> innovatsion ta'lim va gamifikatsiya platformasida ko'rib turganimizdan xursandmiz.
                        </Text>

                        <Section className="bg-blue-50/50 rounded-xl p-6 mb-6">
                            <Text className="text-base text-gray-700 m-0 mb-4">
                                Zukkoo orqali siz quyidagilarni amalga oshirishingiz mumkin:
                            </Text>
                            <ul className="text-base text-gray-700 list-none p-0 m-0 space-y-2">
                                <li>✨ Interaktiv viktorinalar va jamoaviy bellashuvlarda qatnashish.</li>
                                <li>📊 Bilimlaringizni sinab, do'stlaringiz bilan qiziqarli musobaqalashish.</li>
                                <li>🎓 Agar o'qituvchi bo'lsangiz, o'z darslaringizni Zukkoo bilan yuqori darajaga olib chiqish.</li>
                            </ul>
                        </Section>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Link
                                href="https://zukkoo.uz"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white text-[16px] font-semibold no-underline text-center px-6 py-4 block hover:opacity-90 transition-opacity"
                            >
                                Platformaga kirish
                            </Link>
                        </Section>

                        <Text className="text-sm leading-[24px] text-gray-500 mt-8 text-center border-t border-gray-200 pt-8">
                            Agar sizda biron bir savol tug'ilsa, biz onlayn darchamiz orqali yoki email orqali doim yordam berishga tayyormiz.
                            <br /><br />
                            Zukkoo.uz jamoasi, 2026.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WelcomeEmail;
