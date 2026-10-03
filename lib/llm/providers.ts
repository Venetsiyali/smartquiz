// AI provayderlari ro'yxati. Kaliti .env da bo'lmagan provayder avtomatik o'tkazib yuboriladi.
// Har bir provayderning model ro'yxatini kod o'zgartirmasdan env orqali almashtirish mumkin
// (masalan GROQ_MODELS="openai/gpt-oss-120b,qwen/qwen3.8-27b").

export type ProviderId = 'groq' | 'cerebras' | 'mistral' | 'openrouter' | 'gemini';

export interface ProviderConfig {
    id: ProviderId;
    kind: 'openai' | 'gemini';
    baseUrl: string;
    keyEnv: string[];
    modelsEnv: string;
    defaultModels: string[];
    maxTokens: number;
    extraHeaders?: Record<string, string>;
}

export const PROVIDERS: ProviderConfig[] = [
    {
        id: 'groq',
        kind: 'openai',
        baseUrl: 'https://api.groq.com/openai/v1',
        keyEnv: ['GROQ_API_KEYS', 'GROQ_API_KEY'],
        modelsEnv: 'GROQ_MODELS',
        defaultModels: ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'],
        maxTokens: 16000, // gpt-oss'da reasoning tokenlari ham shu limitga kiradi
    },
    {
        id: 'cerebras',
        kind: 'openai',
        baseUrl: 'https://api.cerebras.ai/v1',
        keyEnv: ['CEREBRAS_API_KEYS', 'CEREBRAS_API_KEY'],
        modelsEnv: 'CEREBRAS_MODELS',
        defaultModels: ['gpt-oss-120b', 'qwen-3.8-27b'],
        maxTokens: 16000,
    },
    {
        id: 'mistral',
        kind: 'openai',
        baseUrl: 'https://api.mistral.ai/v1',
        keyEnv: ['MISTRAL_API_KEYS', 'MISTRAL_API_KEY'],
        modelsEnv: 'MISTRAL_MODELS',
        defaultModels: ['mistral-large-latest', 'mistral-small-latest'],
        maxTokens: 8000,
    },
    {
        id: 'openrouter',
        kind: 'openai',
        baseUrl: 'https://openrouter.ai/api/v1',
        keyEnv: ['OPENROUTER_API_KEYS', 'OPENROUTER_API_KEY'],
        modelsEnv: 'OPENROUTER_MODELS',
        // ":free" modellar ro'yxati tez-tez o'zgaradi: https://openrouter.ai/api/v1/models
        defaultModels: ['nvidia/nemotron-3-super-120b-a12b:free', 'google/gemma-4-31b-it:free', 'qwen/qwen3.8-27b:free'],
        maxTokens: 16000,
        extraHeaders: { 'HTTP-Referer': 'https://www.zukkoo.uz', 'X-Title': 'Zukkoo' },
    },
    {
        id: 'gemini',
        kind: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        keyEnv: ['GEMINI_API_KEYS', 'GEMINI_API_KEY'],
        modelsEnv: 'GEMINI_MODELS',
        // Har bir modelning bepul kvotasi alohida — ko'proq model = ko'proq so'rov
        defaultModels: ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'],
        maxTokens: 16384, // thinking tokenlari ham shu limitga kiradi
    },
];

function splitList(value: string | undefined): string[] {
    return value?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
}

export function getProviderKeys(p: ProviderConfig): string[] {
    return Array.from(new Set(p.keyEnv.flatMap(name => splitList(process.env[name]))));
}

export function getProviderModels(p: ProviderConfig): string[] {
    const override = splitList(process.env[p.modelsEnv]);
    return override.length > 0 ? override : p.defaultModels;
}

export function isProviderId(value: unknown): value is ProviderId {
    return typeof value === 'string' && PROVIDERS.some(p => p.id === value);
}
