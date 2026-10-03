// Barcha AI route'lar shu ro'yxatdan foydalanadi — provayder modelni o'chirsa, faqat shu yerni yangilash kifoya.
// Groq'dagi mavjud modellarni tekshirish: GET https://api.groq.com/openai/v1/models
export const GROQ_MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
export const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest'];

// gpt-oss modellarida reasoning tokenlari ham shu limitga kiradi.
export const GROQ_MAX_TOKENS = 16000;
