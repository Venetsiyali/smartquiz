// PsixoLab: oʻqituvchi oʻtkazgan jonli oʻyinlar roʻyxati (shu brauzerda) — natijalarni keyin ochish va Excel uchun.

export interface PsixoGame { pin: string; key: string; mode: 'memory' | 'detective' | 'match'; title: string; at: number }
const KEY = 'psixo-games';

export function loadGames(): PsixoGame[] {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function rememberGame(g: Omit<PsixoGame, 'at'>) {
    try {
        localStorage.setItem(`cr-host-${g.pin}`, g.key);
        localStorage.setItem(KEY, JSON.stringify([{ ...g, at: Date.now() }, ...loadGames()].slice(0, 100)));
    } catch { /* ignore */ }
}
