const createNextIntlPlugin = require('next-intl/plugin');
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development', // Dev muhitida bezovta qilmaslik uchun
  workboxOptions: {
    disableDevLogs: true,
  },
});

const withNextIntl = createNextIntlPlugin(
    './i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    trailingSlash: false,
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    // 301 Redirect: http → https va non-www → www (Google uchun yagona kanonikalURL)
    async redirects() {
        return [
            // http://zukkoo.uz → https://www.zukkoo.uz
            {
                source: '/:path*',
                has: [{ type: 'host', value: 'zukkoo.uz' }],
                destination: 'https://www.zukkoo.uz/:path*',
                permanent: true,  // 301
            },
            // http://www.zukkoo.uz → https://www.zukkoo.uz
            {
                source: '/:path*',
                has: [{ type: 'host', value: 'www.zukkoo.uz' }],
                missing: [{ type: 'header', key: 'x-forwarded-proto', value: 'https' }],
                destination: 'https://www.zukkoo.uz/:path*',
                permanent: true,
            },
        ];
    },
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
                    { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
                ]
            },
            // Barcha sahifalar uchun SEO va xavfsizlik headerlari
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "SAMEORIGIN" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    // Favicon va rasmlarni kesh saqlash (Google indexer uchun)
                    { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
                ]
            },
            // Favicon fayllarini alohida kesh sozlamasi
            {
                source: "/(favicon.ico|favicon-:size.png|apple-touch-icon.png|icon-:size.png)",
                headers: [
                    { key: "Cache-Control", value: "public, max-age=86400, must-revalidate" },
                ]
            },
        ]
    }
};

module.exports = withPWA(withNextIntl(nextConfig));
