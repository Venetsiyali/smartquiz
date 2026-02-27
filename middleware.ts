import { withAuth } from "next-auth/middleware";
import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";

const locales = ['uz', 'ru'];
const publicPages = ['/', '/login', '/pricing', '/muallif', '/blog'];

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale: 'uz',
    localePrefix: 'always'
});

const authMiddleware = withAuth(
    function onSuccess(req) {
        return intlMiddleware(req);
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                const pathname = req.nextUrl.pathname;

                // Only allow ADMIN role on /admin paths (ignoring language prefix)
                if (pathname.includes("/admin")) {
                    return token?.role === "ADMIN";
                }

                // For other protected routes just require any valid login
                return token != null;
            }
        },
        pages: {
            signIn: '/login'
        }
    }
);

export default function middleware(req: NextRequest) {
    const publicPathnameRegex = RegExp(
        `^(/(${locales.join('|')}))?(${publicPages.flatMap((p) => (p === '/' ? ['', '/'] : p)).join('|')})/?$`,
        'i'
    );
    const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

    // If it's a public page OR it's trying to access static assets/Pusher stuff.
    if (isPublicPage) {
        return intlMiddleware(req);
    } else {
        return (authMiddleware as any)(req);
    }
}

export const config = {
    // Skip all paths that should not be internationalized
    matcher: ['/((?!api|_next|.*\\..*).*)']
};
