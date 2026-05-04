import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function GET() {
    // Temporarily removed auth check for debugging

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey   = process.env.GROQ_API_KEY;
    const results: Record<string, { ok: boolean; status?: number; error?: string }> = {};

    // ── Groq models ──────────────────────────────────────────────────────────
    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192'];
    for (const model of groqModels) {
        if (!groqKey) { results[`groq/${model}`] = { ok: false, error: 'GROQ_API_KEY topilmadi' }; continue; }
        try {
            const client = new Groq({ apiKey: groqKey });
            await client.chat.completions.create({
                model,
                messages: [{ role: 'user', content: 'Reply with single word: OK' }],
                max_tokens: 5,
            });
            results[`groq/${model}`] = { ok: true };
        } catch (e: any) {
            results[`groq/${model}`] = { ok: false, status: e?.status, error: e?.message?.slice(0, 200) };
        }
    }

    // ── Gemini models ────────────────────────────────────────────────────────
    const geminiModels = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-exp'];
    for (const model of geminiModels) {
        if (!geminiKey) { results[`gemini/${model}`] = { ok: false, error: 'GEMINI_API_KEY topilmadi' }; continue; }
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: 'Reply with single word: OK' }] }],
                        generationConfig: { maxOutputTokens: 5 },
                    }),
                }
            );
            const body = await res.text();
            if (!res.ok) {
                results[`gemini/${model}`] = { ok: false, status: res.status, error: body.slice(0, 200) };
            } else {
                results[`gemini/${model}`] = { ok: true };
            }
        } catch (e: any) {
            results[`gemini/${model}`] = { ok: false, error: e?.message?.slice(0, 200) };
        }
    }

    const envStatus = {
        GROQ_API_KEY: groqKey ? `✓ set (${groqKey.slice(0, 8)}...)` : '✗ missing',
        GEMINI_API_KEY: geminiKey ? `✓ set (${geminiKey.slice(0, 8)}...)` : '✗ missing',
        GROQ_API_KEYS: process.env.GROQ_API_KEYS ? `✓ set` : '✗ missing',
        GEMINI_API_KEYS: process.env.GEMINI_API_KEYS ? `✓ set` : '✗ missing',
    };

    return NextResponse.json({ env: envStatus, models: results });
}
