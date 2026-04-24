import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
    locales: ['uz', 'ru', 'en'],
    defaultLocale: 'uz',
    localePrefix: 'always',
    localeDetection: false, // Googlebot Accept-Language orqali yo'naltirilmasin
});

export default function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Bot yoki crawler bo'lsa — explicit locale prefix bilan kelsa, redirect qilmaymiz
    const ua = req.headers.get('user-agent') || '';
    const isBot = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver/i.test(ua);

    // Muallif page: Googlebot uchun bypass yo'q chunki sahifa server-rendered
    // Faqat infinite redirect oldini olish: agar url allaqachon locale bilan bo'lsa intl ga o'tkazamiz
    const localePattern = /^\/(uz|ru|en)(\/|$)/;
    if (isBot && localePattern.test(pathname)) {
        // Allaqachon locale bor — intl middleware ni chaqirmaymiz, to'g'ridan-to'g'ri o'tkazamiz
        return NextResponse.next();
    }

    return intlMiddleware(req);
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)']
};
