'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PlanType = 'free' | 'pro' | 'edu';

export interface PlanLimits {
    maxQuestions: number;
    maxPlayers: number;
    aiUpload: boolean;
    customThemes: boolean;
    certificates: boolean;
    legendaryAvatars: boolean;
    label: string;
    icon: string;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    free: {
        maxQuestions: 10, maxPlayers: 20,
        aiUpload: false, customThemes: false, certificates: false, legendaryAvatars: false,
        label: 'Bepul', icon: '🎮',
    },
    pro: {
        maxQuestions: 50, maxPlayers: 200,
        aiUpload: true, customThemes: true, certificates: true, legendaryAvatars: true,
        label: 'Pro', icon: '👑',
    },
    edu: {
        maxQuestions: 50, maxPlayers: 500,
        aiUpload: true, customThemes: true, certificates: true, legendaryAvatars: true,
        label: 'EDU', icon: '🏫',
    },
};

interface SubCtx {
    plan: PlanType;
    setPlan: (p: PlanType) => void;
    limits: PlanLimits;
    isPro: boolean;
    isEdu: boolean;
    isFree: boolean;
}

const SubscriptionContext = createContext<SubCtx | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const [plan, setPlanState] = useState<PlanType>('free');

    useEffect(() => {
        const stored = localStorage.getItem('zk_plan') as PlanType | null;
        if (stored && stored in PLAN_LIMITS) setPlanState(stored);
    }, []);

    const setPlan = (p: PlanType) => {
        setPlanState(p);
        localStorage.setItem('zk_plan', p);
    };

    return (
        <SubscriptionContext.Provider value={{
            plan, setPlan,
            limits: PLAN_LIMITS[plan],
            isPro: plan === 'pro' || plan === 'edu',
            isEdu: plan === 'edu',
            isFree: plan === 'free',
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription(): SubCtx {
    const ctx = useContext(SubscriptionContext);
    if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider');
    return ctx;
}

/** Inline Pro lock badge for feature gates */
export function ProLock({ tip = "Pro xususiyat" }: { tip?: string }) {
    return (
        <span title={tip}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black cursor-help"
            style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}>
            🔒 Pro
        </span>
    );
}

/** Crown badge for pro teachers */
export function CrownBadge() {
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black"
            style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)', color: '#0a0a0a', boxShadow: '0 4px 12px rgba(255,215,0,0.4)' }}>
            👑 Pro
        </span>
    );
}
