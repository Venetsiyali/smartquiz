// Ko'p tanlovli savollarda "to'g'ri javob = eng uzun variant" naqshining oldini olish.

export const OPTION_BALANCE_RULES = `# VARIANTLAR MUVOZANATI (QAT'IY QOIDA — o'quvchi javobni variant ko'rinishidan topib olmasin)
1. To'g'ri javob HECH QACHON eng uzun yoki eng batafsil variant bo'lmasin. 4 ta variant uzunligi deyarli teng bo'lsin (farq 20% dan oshmasin).
2. Barcha variantlar bir xil grammatik tuzilishda va bir xil aniqlik darajasida yozilsin. To'g'ri javobga qo'shimcha izoh, qavs yoki aniqlashtiruvchi so'zlar ("odatda", "asosan", "ma'lum sharoitda") qo'shmang.
3. To'g'ri javob tabiatan uzun bo'lsa — noto'g'ri variantlarni ham shunchalik batafsil yozing; aks holda to'g'ri javobni qisqartiring.
4. To'g'ri javob savol matnidagi so'zlarni takrorlamasin (o'quvchi so'z mosligidan topib olmasin).
5. Noto'g'ri variantlar ham bir xil mavzu doirasida, ishonchli va to'g'ri ko'rinadigan bo'lsin.`;

/**
 * To'g'ri javob boshqa variantlardan sezilarli darajada uzunmi.
 * Qisqa javoblar (raqamlar, bitta so'z) uchun kichik farq hisobga olinmaydi.
 */
export function hasLengthGiveaway(options: string[], correctIndex: number): boolean {
    if (options.length < 2 || correctIndex < 0 || correctIndex >= options.length) return false;
    const lens = options.map(o => String(o).trim().length);
    const correctLen = lens[correctIndex];
    const maxOther = Math.max(...lens.filter((_, i) => i !== correctIndex));
    return correctLen > maxOther * 1.25 && correctLen - maxOther >= 6;
}

/** AI'dan zaxira bilan ko'proq savol so'raladi, keyin eng muvozanatlilari tanlanadi. */
export function withBalanceBuffer(count: number): number {
    return count + Math.max(2, Math.ceil(count * 0.25));
}

/**
 * Uzunlik bo'yicha "shpargalka" bermaydigan savollarni birinchi navbatda tanlaydi,
 * yetmasa qolganlari bilan to'ldiradi. Asl tartib saqlanadi.
 */
export function pickBalanced<T>(items: T[], count: number, getOptions: (item: T) => { options: string[]; correctIndex: number }): T[] {
    const flagged = items.map(item => {
        const { options, correctIndex } = getOptions(item);
        return hasLengthGiveaway(options, correctIndex);
    });

    const keep = new Set<number>();
    items.forEach((_, i) => { if (!flagged[i] && keep.size < count) keep.add(i); });
    items.forEach((_, i) => { if (flagged[i] && keep.size < count) keep.add(i); });

    const flaggedKept = flagged.filter((f, i) => f && keep.has(i)).length;
    if (flaggedKept > 0) {
        console.warn(`[Question Quality] ${flaggedKept}/${keep.size} ta savolda to'g'ri javob sezilarli darajada eng uzun variant (zaxira yetmadi)`);
    }

    return items.filter((_, i) => keep.has(i));
}
