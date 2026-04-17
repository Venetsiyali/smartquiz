"use client";

import React, { useMemo } from 'react';

// Platformaning jozibadorligini oshirish uchun qahramon holatlari
export type MascotState =
  | 'idle_boy'       // Asosiy qahramon (O'g'il)
  | 'excellent_boy'  // A'LO! (O'g'il)
  | 'thinking_boy'   // O'YLASH (O'g'il)
  | 'wow_boy'        // HAYRAT! (O'g'il)
  | 'shame_boy'      // UYAT! (O'g'il)
  | 'goal_boy'       // MAQSAD! (O'g'il)
  | 'victory_boy'    // G'ALABA! (O'g'il)
  | 'talent_boy'     // STE'DOD! (O'g'il)
  | 'idle_girl'      // Asosiy qahramon (Qiz)
  | 'excellent_girl' // A'LO! (Qiz)
  | 'thinking_girl'  // O'YLASH (Qiz)
  | 'wow_girl'       // HAYRAT! (Qiz)
  | 'shame_girl'     // UYAT! (Qiz)
  | 'goal_girl'      // MAQSAD! (Qiz)
  | 'victory_girl'   // G'ALABA! (Qiz)
  | 'talent_girl'    // STE'DOD! (Qiz)
  ;

interface MascotSpriteProps {
  state: MascotState;
  size?: number; // Komponent kengligi (px)
  className?: string;
}

// Rasmning to'liq o'lchamlari (siz kiritgan mascot.png)
const TOTAL_WIDTH = 2760;
const TOTAL_HEIGHT = 1504;

// Har bir holat uchun qirqib olinadigan koordinatalar
// x, y (boshlanish nuqtasi) va w, h (kenglik va balandligi)
// Diqqat: Bu koordinatalar rasmga qarab taxminan belgilangan, 
// agar qahramon chetlari uzilib qolsa, shu yerda raqamlarni bir oz o'zgartirishingiz mumkin.
const spriteMap: Record<MascotState, { x: number; y: number; w: number; h: number }> = {
  // --- O'G'IL BOLA (Chap taraf) ---
  idle_boy:       { x: 60, y: 370, w: 480, h: 680 },
  excellent_boy:  { x: 580, y: 320, w: 320, h: 280 },
  thinking_boy:   { x: 920, y: 320, w: 320, h: 280 },
  wow_boy:        { x: 580, y: 640, w: 320, h: 280 },
  shame_boy:      { x: 920, y: 640, w: 320, h: 280 },
  goal_boy:       { x: 580, y: 960, w: 320, h: 280 },
  victory_boy:    { x: 920, y: 960, w: 320, h: 280 },
  talent_boy:     { x: 750, y: 1250, w: 320, h: 250 }, 

  // --- QIZ BOLA (O'ng taraf) ---
  idle_girl:      { x: 1440, y: 370, w: 480, h: 680 },
  excellent_girl: { x: 2000, y: 300, w: 350, h: 290 },
  thinking_girl:  { x: 2360, y: 300, w: 350, h: 290 },
  wow_girl:       { x: 2000, y: 610, w: 350, h: 290 },
  shame_girl:     { x: 2360, y: 610, w: 350, h: 290 },
  goal_girl:      { x: 2000, y: 930, w: 350, h: 290 },
  victory_girl:   { x: 2360, y: 930, w: 350, h: 290 },
  talent_girl:    { x: 2180, y: 1220, w: 350, h: 280 },
};

export const MascotSprite: React.FC<MascotSpriteProps> = ({ state, size = 150, className = '' }) => {
  const cssStyle = useMemo(() => {
    const crop = spriteMap[state] || spriteMap['idle_boy'];
    
    // Asl rasm proporsiyasi asosida skalalash faktorini aniqlash
    const scale = size / crop.w;
    const scaledHeight = crop.h * scale;

    return {
      width: `${size}px`,
      height: `${scaledHeight}px`,
      backgroundImage: `url('/mascot.png')`,
      backgroundSize: `${TOTAL_WIDTH * scale}px ${TOTAL_HEIGHT * scale}px`,
      backgroundPosition: `-${crop.x * scale}px -${crop.y * scale}px`,
      backgroundRepeat: 'no-repeat',
      borderRadius: '20px', // Chetlari chiroyli bo'lishi uchun
    };
  }, [state, size]);

  return (
    <div 
      className={`inline-block transition-transform duration-300 ease-in-out hover:scale-105 ${className}`} 
      style={cssStyle}
      role="img"
      aria-label={`Mascot ${state}`}
    />
  );
};
