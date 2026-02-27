/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    eslint: {
        // Next.js 14 passes deprecated ESLint options (useEslintrc, extensions)
        // that were removed in ESLint 9 — skip ESLint during build to avoid crash.
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
};

module.exports = nextConfig;
