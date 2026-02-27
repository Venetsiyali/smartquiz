import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface OTPEmailProps {
    otp: string;
}

export const OTPEmail = ({ otp }: OTPEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Sizning Zukkoo tizimiga kirish kodingiz: {otp}</Preview>
            <Tailwind>
                <Body className="bg-gray-100 font-sans my-auto mx-auto p-4 text-gray-900">
                    <Container className="bg-white border border-gray-200 rounded-2xl shadow-lg mt-[40px] mx-auto p-8 max-w-[500px]">
                        <Section className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-md mb-4">
                                Z
                            </div>
                            <Heading className="text-2xl font-bold text-gray-900 mx-0 mt-0 mb-4 p-0">
                                Kirish kodingiz
                            </Heading>
                        </Section>

                        <Text className="text-base leading-[24px] text-gray-700 mb-6 text-center">
                            Zukkoo tizimiga kirish (yoki ro'yxatdan o'tish) uchun quyidagi tasdiqlash kodidan foydalaning:
                        </Text>

                        <Section className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-100 flex justify-center text-center">
                            <Text className="text-4xl font-black text-blue-600 tracking-widest m-0">
                                {otp}
                            </Text>
                        </Section>

                        <Text className="text-sm leading-[24px] text-gray-500 mt-8 text-center border-t border-gray-200 pt-8">
                            Ushbu kod 10 daqiqa davomida amal qiladi. Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xatni e'tiborsiz qoldiring.
                            <br /><br />
                            Zukkoo.uz jamoasi, 2026.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default OTPEmail;
