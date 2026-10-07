'use client';

import PusherClient from 'pusher-js';

let pusherInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
    if (!pusherInstance) {
        pusherInstance = new PusherClient(
            process.env.NEXT_PUBLIC_PUSHER_KEY!,
            {
                cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                forceTLS: true,
                // Telefon uxlab qolsa yoki Wi-Fi uzilsa, o'lik ulanishni ~2 daqiqa emas, ~30 soniyada aniqlab qayta ulanadi
                activityTimeout: 20_000,
                pongTimeout: 10_000,
            }
        );
    }
    return pusherInstance;
}
