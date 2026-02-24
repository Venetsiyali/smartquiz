/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Nunito', 'sans-serif'],
            },
            colors: {
                zukkoo: {
                    blue: '#0056b3',
                    blueDark: '#003d82',
                    blueLight: '#1a7de8',
                    yellow: '#FFD600',
                    green: '#00E676',
                    red: '#FF1744',
                    dark: '#0a0f1e',
                    darker: '#060a14',
                },
            },
            animation: {
                'bounce-in': 'bounceIn 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both',
                'slide-up': 'slideUp 0.4s ease-out both',
                'scale-in': 'scaleIn 0.4s cubic-bezier(0.36,0.07,0.19,0.97) both',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
                'float': 'float 3s ease-in-out infinite',
                'spin-slow': 'spin 4s linear infinite',
                'glow': 'glow 2s ease-in-out infinite',
            },
            keyframes: {
                bounceIn: {
                    '0%': { transform: 'scale(0.3)', opacity: '0' },
                    '50%': { transform: 'scale(1.1)', opacity: '0.9' },
                    '70%': { transform: 'scale(0.95)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.8)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                float: {
                    '0%,100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glow: {
                    '0%,100%': { opacity: '1' },
                    '50%': { opacity: '0.6' },
                },
            },
        },
    },
    plugins: [],
};
