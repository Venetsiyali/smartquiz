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
                primary: '#6C63FF',
                secondary: '#FF6B6B',
                accent: '#FFD93D',
                success: '#6BCB77',
                brand: {
                    purple: '#6C63FF',
                    pink: '#FF6B6B',
                    yellow: '#FFD93D',
                    green: '#6BCB77',
                },
            },
            animation: {
                'bounce-in': 'bounceIn 0.5s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'pulse-slow': 'pulse 2s ease-in-out infinite',
                'spin-slow': 'spin 3s linear infinite',
                'scale-in': 'scaleIn 0.3s ease-out',
            },
            keyframes: {
                bounceIn: {
                    '0%': { transform: 'scale(0.3)', opacity: '0' },
                    '50%': { transform: 'scale(1.05)', opacity: '0.8' },
                    '70%': { transform: 'scale(0.9)', opacity: '0.9' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(30px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.8)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};
