import Groq from 'groq-sdk';
import { GROQ_MODELS, GEMINI_MODELS, GROQ_MAX_TOKENS } from '@/lib/aiModels';

// Fisher-Yates shuffle
export function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getKeys(envVar: string | undefined, fallback: string | undefined): string[] {
    const multi1 = envVar?.split(',').map(k => k.trim()).filter(Boolean) ?? [];
    const multi2 = fallback?.split(',').map(k => k.trim()).filter(Boolean) ?? [];
    return Array.from(new Set([...multi1, ...multi2]));
}

type Candidate = { provider: 'gemini' | 'groq'; key: string; model: string };

async function callGemini(key: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 25000);
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nReturn ONLY valid JSON. No markdown wrappers.` }] }],
                    generationConfig: { temperature: 0.8, responseMimeType: 'application/json', maxOutputTokens: 8192 },
                }),
                signal: controller.signal,
            }
        );
        clearTimeout(id);
        if (!res.ok) {
            const body = await res.text();
            const err: any = new Error(`Gemini xatosi: ${res.status}`);
            err.status = res.status;
            err.details = body;
            throw err;
        }
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

async function callGroq(key: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const client = new Groq({ apiKey: key, timeout: 25000, maxRetries: 0 });
    const completion = await client.chat.completions.create({
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        top_p: 1,
        max_tokens: GROQ_MAX_TOKENS,
    });
    return completion.choices[0]?.message?.content || '';
}

/**
 * Groq + Gemini key/model pool bo'yicha ketma-ket urinadi, birinchi muvaffaqiyatli
 * xom (raw) matnni qaytaradi. Hech biri ishlamasa Error tashlaydi.
 */
export async function callAIPool(systemPrompt: string, userPrompt: string, preferredProvider: 'groq' | 'gemini' = 'groq'): Promise<string> {
    const geminiKeys = getKeys(process.env.GEMINI_API_KEYS, process.env.GEMINI_API_KEY);
    const groqKeys = getKeys(process.env.GROQ_API_KEYS, process.env.GROQ_API_KEY);

    const expandGemini = (keys: string[]): Candidate[] =>
        keys.flatMap(k => GEMINI_MODELS.map(m => ({ provider: 'gemini' as const, key: k, model: m })));
    const expandGroq = (keys: string[]): Candidate[] =>
        keys.flatMap(k => GROQ_MODELS.map(m => ({ provider: 'groq' as const, key: k, model: m })));

    const primaryList = shuffle(preferredProvider === 'gemini' ? expandGemini(geminiKeys) : expandGroq(groqKeys));
    const fallbackList = shuffle(preferredProvider === 'gemini' ? expandGroq(groqKeys) : expandGemini(geminiKeys));
    const allCandidates: Candidate[] = [...primaryList, ...fallbackList];

    if (allCandidates.length === 0) {
        throw new Error('AI kaliti sozlanmagan');
    }

    let lastError = '';
    const startTime = Date.now();

    for (let ci = 0; ci < allCandidates.length; ci++) {
        if (Date.now() - startTime > 45000) break;
        const { provider: cur, key, model } = allCandidates[ci];
        try {
            const raw = cur === 'gemini'
                ? await callGemini(key, model, systemPrompt, userPrompt)
                : await callGroq(key, model, systemPrompt, userPrompt);
            if (raw) return raw;
            lastError = "AI bo'sh javob qaytardi";
        } catch (err: any) {
            lastError = err?.message || 'AI xatoligi';
            console.warn(`[Wheel AI Pool] ${cur}/${model} #${ci} xato: ${lastError.slice(0, 120)} — keyingisiga o'tildi`);
            continue;
        }
    }

    throw new Error(lastError || "AI javob bermadi");
}

/** JSON matnni ```json fence, qavslar va trailing comma'lardan tozalab ajratib oladi. */
export function extractJsonArray(raw: string): any[] {
    let text = raw.trim();
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1].trim();

    const arrStart = text.indexOf('[');
    const objStart = text.indexOf('{');
    const start = arrStart === -1 ? objStart : (objStart === -1 ? arrStart : Math.min(arrStart, objStart));
    if (start === -1) throw new Error('JSON topilmadi');

    const cleaned = text.slice(start)
        .replace(/[“”„«»]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/,\s*([}\]])/g, '$1');

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.questions)) return parsed.questions;
    throw new Error("JSON massiv formatida emas");
}
