import Pusher from 'pusher';

export const pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
});

export interface PusherEvent { channel: string; name: string; data: unknown }

/** Bir nechta eventni bitta so'rovda yuboradi (Pusher batch — 10 tadan). Ketma-ket trigger'dan ancha tez. */
export async function triggerAll(events: PusherEvent[]): Promise<void> {
    for (let i = 0; i < events.length; i += 10) {
        await pusherServer.triggerBatch(events.slice(i, i + 10) as any);
    }
}
