import { createHash } from 'crypto';
import { PROVIDERS, ProviderConfig, ProviderId, getProviderKeys, getProviderModels } from './providers';

export interface LLMRequest {
    system: string;
    user: string;
    temperature?: number;
    preferred?: ProviderId;
    /** Butun pool uchun umumiy vaqt (ms). Undan oshsa keyingi nomzodlar sinab ko'rilmaydi. */
    budgetMs?: number;
    /** "provider/model" ko'rinishida — masalan, oldin yaroqsiz JSON qaytargan model. */
    skip?: string[];
    /** Faqat shu provayderlardan foydalanish (masalan, tekshiruvchi generatordan boshqa bo'lishi uchun). */
    providers?: ProviderId[];
}

export interface LLMResult {
    text: string;
    provider: ProviderId;
    model: string;
}

export class LLMUnavailableError extends Error {
    constructor(message: string, public allRateLimited: boolean, public retryAfterSec: number | null) {
        super(message);
    }
}

interface Candidate {
    provider: ProviderConfig;
    key: string;
    keyId: string;
    model: string;
}

const PER_CALL_TIMEOUT_MS = 25_000;

// ─── Circuit breaker (har bir server instansiyasida, xotirada) ────────────────
// Yaqinda yiqilgan nomzodlar vaqtincha o'tkazib yuboriladi — o'lik modelni kutib vaqt yo'qotilmaydi.
const cooldownUntil = new Map<string, number>();
const rateLimitedUntil = new Map<string, number>();

function keyFingerprint(key: string): string {
    return createHash('sha256').update(key).digest('hex').slice(0, 10);
}

function isCooling(id: string): boolean {
    const until = cooldownUntil.get(id);
    if (!until) return false;
    if (until <= Date.now()) {
        cooldownUntil.delete(id);
        rateLimitedUntil.delete(id);
        return false;
    }
    return true;
}

function coolDown(id: string, ms: number, rateLimited = false) {
    const until = Date.now() + ms;
    cooldownUntil.set(id, until);
    if (rateLimited) rateLimitedUntil.set(id, until);
}

class ProviderHttpError extends Error {
    constructor(public status: number, public body: string, public retryAfterSec: number | null) {
        super(`HTTP ${status}`);
    }
}

function parseRetryAfter(headerValue: string | null, body: string): number | null {
    if (headerValue && !isNaN(Number(headerValue))) return Math.ceil(Number(headerValue));
    const sec = body.match(/(?:try again|retry) in (\d+(?:\.\d+)?)\s*s/i);
    if (sec) return Math.ceil(parseFloat(sec[1]));
    const min = body.match(/(?:try again|retry) in (\d+(?:\.\d+)?)\s*m/i);
    if (min) return Math.ceil(parseFloat(min[1]) * 60);
    return null;
}

// ─── Provayder chaqiruvlari ───────────────────────────────────────────────────

async function callOpenAICompatible(c: Candidate, req: LLMRequest, signal: AbortSignal): Promise<string> {
    const res = await fetch(`${c.provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${c.key}`,
            ...c.provider.extraHeaders,
        },
        body: JSON.stringify({
            model: c.model,
            messages: [
                { role: 'system', content: req.system },
                { role: 'user', content: req.user },
            ],
            temperature: req.temperature ?? 0.8,
            max_tokens: c.provider.maxTokens,
        }),
        signal,
    });
    const body = await res.text();
    if (!res.ok) throw new ProviderHttpError(res.status, body, parseRetryAfter(res.headers.get('retry-after'), body));
    const data = JSON.parse(body);
    const content: string = data.choices?.[0]?.message?.content ?? '';
    // Ba'zi reasoning modellar fikrlash qismini content ichida qaytaradi
    return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

async function callGemini(c: Candidate, req: LLMRequest, signal: AbortSignal): Promise<string> {
    const res = await fetch(`${c.provider.baseUrl}/models/${c.model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': c.key },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: req.system }] },
            contents: [{ role: 'user', parts: [{ text: `${req.user}\n\nReturn ONLY valid JSON. No markdown wrappers.` }] }],
            generationConfig: {
                temperature: req.temperature ?? 0.8,
                responseMimeType: 'application/json',
                maxOutputTokens: c.provider.maxTokens,
            },
        }),
        signal,
    });
    const body = await res.text();
    if (!res.ok) throw new ProviderHttpError(res.status, body, parseRetryAfter(res.headers.get('retry-after'), body));
    const data = JSON.parse(body);
    const parts: { text?: string; thought?: boolean }[] = data.candidates?.[0]?.content?.parts ?? [];
    return parts.filter(p => !p.thought).map(p => p.text ?? '').join('').trim();
}

// ─── Nomzodlar tartibi ────────────────────────────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildCandidates(preferred?: ProviderId, allowed?: ProviderId[]): Candidate[] {
    const configured = PROVIDERS.filter(p => getProviderKeys(p).length > 0 && (!allowed || allowed.includes(p.id)));
    // Afzal provayder birinchi, qolganlari har safar aralash tartibda — yuk provayderlar orasida taqsimlanadi
    const ordered = [
        ...configured.filter(p => p.id === preferred),
        ...shuffled(configured.filter(p => p.id !== preferred)),
    ];
    return ordered.flatMap(provider => {
        const keys = shuffled(getProviderKeys(provider));
        return getProviderModels(provider).flatMap(model =>
            keys.map(key => ({ provider, key, keyId: keyFingerprint(key), model }))
        );
    });
}

export function configuredProviderIds(): ProviderId[] {
    return PROVIDERS.filter(p => getProviderKeys(p).length > 0).map(p => p.id);
}

export interface ProbeResult { ok: boolean; ms: number; status?: number; error?: string }

/** Admin diagnostikasi: har bir provayderning birinchi kaliti bilan har bir modelga kichik so'rov yuboradi. */
export async function probeProviders(): Promise<Record<string, ProbeResult & { keys: number }>> {
    const req: LLMRequest = { system: 'Reply with the single word OK as JSON: {"ok":true}', user: 'OK', temperature: 0 };
    const results: Record<string, ProbeResult & { keys: number }> = {};
    await Promise.all(PROVIDERS.map(async provider => {
        const keys = getProviderKeys(provider);
        for (const model of getProviderModels(provider)) {
            const id = `${provider.id}/${model}`;
            if (keys.length === 0) {
                results[id] = { ok: false, ms: 0, keys: 0, error: 'kalit sozlanmagan' };
                continue;
            }
            const c: Candidate = { provider, key: keys[0], keyId: keyFingerprint(keys[0]), model };
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 20_000);
            const start = Date.now();
            try {
                const text = provider.kind === 'gemini' ? await callGemini(c, req, controller.signal) : await callOpenAICompatible(c, req, controller.signal);
                results[id] = { ok: text.length > 0, ms: Date.now() - start, keys: keys.length };
            } catch (err: any) {
                results[id] = err instanceof ProviderHttpError
                    ? { ok: false, ms: Date.now() - start, keys: keys.length, status: err.status, error: err.body.slice(0, 160) }
                    : { ok: false, ms: Date.now() - start, keys: keys.length, error: err?.name === 'AbortError' ? 'timeout' : String(err?.message ?? err) };
            } finally {
                clearTimeout(timer);
            }
        }
    }));
    return results;
}

/**
 * Sozlangan barcha provayder/kalit/modellarni ketma-ket sinaydi va birinchi muvaffaqiyatli javobni qaytaradi.
 * Hech biri ishlamasa LLMUnavailableError tashlaydi.
 */
export async function callLLM(req: LLMRequest): Promise<LLMResult> {
    const start = Date.now();
    const budget = req.budgetMs ?? 45_000;
    const skip = new Set(req.skip ?? []);
    const candidates = buildCandidates(req.preferred, req.providers);

    if (candidates.length === 0) {
        throw new LLMUnavailableError('AI kaliti sozlanmagan', false, null);
    }

    let lastError = '';
    let attempted = 0;
    let rateLimitedCount = 0;
    // Shu so'rov davomida timeout/5xx bergan provayder — uning qolgan modellarini kutib vaqt yo'qotmaymiz
    const unhealthyProviders = new Set<ProviderId>();

    for (const c of candidates) {
        const modelId = `${c.provider.id}/${c.model}`;
        const keyModelId = `${c.provider.id}|${c.keyId}|${c.model}`;
        const keyId = `${c.provider.id}|${c.keyId}`;
        if (unhealthyProviders.has(c.provider.id)) continue;
        if (skip.has(modelId) || isCooling(keyModelId) || isCooling(keyId) || isCooling(modelId)) continue;

        const remaining = budget - (Date.now() - start);
        if (remaining < 3_000) break;

        attempted++;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), Math.min(PER_CALL_TIMEOUT_MS, remaining));
        const callStart = Date.now();
        try {
            const text = c.provider.kind === 'gemini'
                ? await callGemini(c, req, controller.signal)
                : await callOpenAICompatible(c, req, controller.signal);
            clearTimeout(timer);
            if (!text) {
                lastError = "bo'sh javob";
                coolDown(keyModelId, 20_000);
                continue;
            }
            console.log(`[LLM] ${modelId} OK (${Date.now() - callStart}ms)`);
            return { text, provider: c.provider.id, model: c.model };
        } catch (err: any) {
            clearTimeout(timer);
            if (err instanceof ProviderHttpError) {
                const { status, body } = err;
                lastError = `${modelId} HTTP ${status}`;
                if (status === 429) {
                    rateLimitedCount++;
                    const sec = Math.min(err.retryAfterSec ?? 30, 600);
                    coolDown(keyModelId, sec * 1000, true);
                } else if (status === 413) {
                    coolDown(keyModelId, 30 * 60_000); // so'rov bu model/tarif limitidan katta — tez orada o'zgarmaydi
                } else if (status === 401 || status === 403) {
                    coolDown(keyId, 60 * 60_000); // kalit yaroqsiz yoki bloklangan
                } else if (status === 404 || (status === 400 && /decommission|not found|does not exist|no longer|not available|invalid model/i.test(body))) {
                    coolDown(modelId, 6 * 60 * 60_000); // model o'chirilgan
                } else {
                    coolDown(keyModelId, 20_000);
                    if (status >= 500) unhealthyProviders.add(c.provider.id);
                }
                console.warn(`[LLM] ${modelId} xato ${status}: ${body.slice(0, 140).replace(/\s+/g, ' ')}`);
            } else {
                lastError = `${modelId} ${err?.name === 'AbortError' ? 'timeout' : err?.message ?? 'xato'}`;
                coolDown(keyModelId, 20_000);
                unhealthyProviders.add(c.provider.id);
                console.warn(`[LLM] ${lastError}`);
            }
        }
    }

    const allRateLimited = attempted > 0 && rateLimitedCount === attempted;
    const pending = Array.from(rateLimitedUntil.values()).filter(t => t > Date.now());
    const retryAfterSec = pending.length > 0 ? Math.ceil((Math.min(...pending) - Date.now()) / 1000) : null;
    throw new LLMUnavailableError(lastError || 'Barcha AI nomzodlari vaqtincha band', allRateLimited || (attempted === 0 && pending.length > 0), retryAfterSec);
}
