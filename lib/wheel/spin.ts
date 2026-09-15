/** Kriptografik jihatdan xavfsiz tasodifiy butun son [0, max). */
export function secureRandomInt(max: number): number {
    if (max <= 0) return 0;
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
}

/** O'yinchilar orasidan tasodifiy g'olib indeksini tanlaydi. */
export function pickWinnerIndex(playerCount: number): number {
    return secureRandomInt(playerCount);
}

/**
 * Barabanni winnerIndex sektoriga olib keladigan yakuniy burchakni hisoblaydi.
 * Natija oldindan tanlangan (pickWinnerIndex), animatsiya faqat shu burchakka olib boradi.
 * currentRotation — barabanning hozirgi umumiy aylanish burchagi (uzluksiz o'sib boradi,
 * shunda CSS transition har doim oldinga aylanadi, hech qachon orqaga qaytmaydi).
 */
export function computeSpinRotation(winnerIndex: number, sectorCount: number, currentRotation: number): number {
    const sectorAngle = 360 / sectorCount;
    // Sektor markazi 12 soat (pointer) belgisiga to'g'ri kelishi uchun.
    const targetAngleWithinCircle = 360 - (winnerIndex * sectorAngle + sectorAngle / 2);
    const fullSpins = 5; // kamida 5 marta to'liq aylanish — vizual effekt uchun
    const baseRotation = Math.floor(currentRotation / 360) * 360 + fullSpins * 360;
    let finalRotation = baseRotation + targetAngleWithinCircle;
    // Har doim oldingi burchakdan katta bo'lishini ta'minlaymiz
    while (finalRotation <= currentRotation) finalRotation += 360;
    return finalRotation;
}
