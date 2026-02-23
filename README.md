# ⚡ SmartQuiz Interactive

Real-vaqt rejimida ta'limiy viktorina platformasi (Kahoot analogi) — Next.js + Pusher + Upstash Redis

## Tech Stack

| To'plam | Maqsad |
|---|---|
| Next.js 14 | Frontend + API Routes |
| Pusher | Real-vaqt WebSocket hodisalari |
| Upstash Redis | O'yin holati saqlash |
| qrcode.react | Dinamik QR kodlar |
| Tailwind CSS | Dizayn |

## Local ishga tushurish

```bash
npm install
cp .env.example .env.local
# .env.local faylini to'ldiring (Pusher + Upstash)
npm run dev
```

## Vercel Deploy

1. GitHub ga push qiling
2. [vercel.com](https://vercel.com) da import qiling
3. Environment variables qo'shing (`.env.example` ga qarang)
4. Deploy!

## Xizmatlarni sozlash

### Pusher (bepul tier)
1. [pusher.com](https://pusher.com) da hisob oching
2. Channels → Create App → EU cluster tanlang
3. "App Keys" dan: `app_id`, `key`, `secret`, `cluster` oling

### Upstash Redis (bepul tier)
1. [upstash.com](https://upstash.com) da hisob oching
2. Redis → Create Database → Global tanlang
3. REST API dan: `UPSTASH_REDIS_REST_URL` va `UPSTASH_REDIS_REST_TOKEN` oling

## O'yinni ishlatish

### O'qituvchi:
1. `/` → "O'qituvchi" → Quiz yarating
2. Lobby da QR kod + PIN talabalarga ko'rsating
3. "O'yinni Boshlash" tugmasini bosing

### Talaba:
1. `/play` → PIN + Nikneym kiriting
2. O'qituvchi boshlashini kuting
3. 🔴🔵🟡🟢 tugmalardan javob tanlang

## Ball tizimi

```
ball = 200 + 800 × (qolgan_vaqt / jami_vaqt)
Maks: 1000 ball | Min: 200 ball | Noto'g'ri: 0 ball
```
