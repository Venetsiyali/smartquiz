'use client';

export default function NotFound() {
    return (
        <div className="bg-[#0a0f1c] text-white flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-4xl font-black mb-4">404</h1>
                <p className="text-white/50 mb-6">Sahifa topilmadi | Page not found</p>
                <a href="/uz" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all">
                    Bosh sahifaga qaytish
                </a>
            </div>
        </div>
    );
}
