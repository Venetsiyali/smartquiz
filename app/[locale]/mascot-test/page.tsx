"use client";

import React, { useState } from 'react';
import { MascotSprite, MascotState } from '@/components/gamification/MascotSprite';

const allStates: MascotState[] = [
  'idle_boy', 'excellent_boy', 'thinking_boy', 'wow_boy', 'shame_boy', 'goal_boy', 'victory_boy', 'talent_boy',
  'idle_girl', 'excellent_girl', 'thinking_girl', 'wow_girl', 'shame_girl', 'goal_girl', 'victory_girl', 'talent_girl'
];

export default function MascotTestPage() {
  const [size, setSize] = useState(200);

  return (
    <div className="p-8 min-h-screen bg-slate-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Mascot Sprite Test</h1>
      
      <div className="mb-8">
        <label className="mr-4">Hajmi (px): {size}</label>
        <input 
          type="range" 
          min="50" max="600" 
          value={size} 
          onChange={(e) => setSize(Number(e.target.value))} 
          className="w-64"
        />
        <p className="text-gray-400 text-sm mt-2">
          Agar qahramonning ba'zi qismlari kesilib qolsa yoki ortiqcha joy ko'rinsa, 
          <code>components/gamification/MascotSprite.tsx</code> faylidagi <code>spriteMap</code> koordinatalarini o'zgartiring.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {allStates.map((state) => (
          <div key={state} className="flex flex-col items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="mb-4 font-semibold text-lg text-amber-400 capitalize">{state.replace('_', ' ')}</h3>
            <div className="border-2 border-dashed border-gray-600 p-2 rounded-2xl bg-white/5">
              <MascotSprite state={state} size={size} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
