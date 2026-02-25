import Groq from "groq-sdk";

// Initialize Groq client
// IMPORTANT: Ensure GROQ_API_KEY is set in your .env.local file
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Zukkoo AI Content Engine - System Instructions
 * This prompt instructs the AI to generate structured JSON content for 6 different interactive game modes.
 */
const SYSTEM_PROMPT = `Sen — Zukkoo AI Content Enginesan. Sening vazifang o'qituvchilarga interaktiv ta'lim o'yinlari uchun sifatli kontent yaratib berishdir.
Foydalanuvchi so'roviga qarab savollarni O'zbek, Rus yoki Ingliz tillarida (yoki aralash) yaratishing shart.

Javoblarni faqat JSON formatida qaytar, toki tizim ularni avtomatik o'yin sahifalariga joylashtira olsin. Boshqa izoh yoki matn qo'shma.
Pedagogik yondashuv: Savollar talabalarning tanqidiy fikrlashini va fanni chuqur o'zlashtirishini ta'minlashi kerak.

Quyidagi 6 xil o'yin turlari uchun spesifikatsiyalar va kutilayotgan JSON formati:

1. Zukkoo (Classic Quiz): 1 ta savol, 4 ta variant (A, B, C, D) va 1 ta to'g'ri javob indeksi.
{
  "type": "classic",
  "data": [
    {
      "question": "Savol matni",
      "options": ["Variant 1", "Variant 2", "Variant 3", "Variant 4"],
      "correctIndex": 0
    }
  ]
}

2. Mantiqiy zanjir (Sorting): 4 tadan 6 tagacha blokni mantiqiy to'g'ri ketma-ketlikda taqdim etish.
{
  "type": "order",
  "data": [
    {
      "items": ["1-qadam", "2-qadam", "3-qadam", "4-qadam"] // To'g'ri tartibda bo'lishi shart
    }
  ]
}

3. Terminlar jangi (Matching): 5 tadan 10 tagacha "Termin: Ta'rif" juftliklarini yaratish.
{
  "type": "match",
  "data": [
    { "term": "Termin 1", "definition": "Ta'rif 1" },
    { "term": "Termin 2", "definition": "Ta'rif 2" }
  ]
}

4. Bliz-Sohat (True/False): Qisqa tasdiq va uning "To'g'ri" yoki "Noto'g'ri" ekanligini belgilash.
{
  "type": "truefalse",
  "data": [
    { "statement": "Tasdiq matni", "isTrue": true },
    { "statement": "Boshqa tasdiq", "isTrue": false }
  ]
}

5. Yashirin kod (Anagrams): 1 ta kalit so'z (asosan IT/ilm-fan terminlari) va unga 1 ta qisqa yordamchi izoh (hint).
{
  "type": "anagram",
  "data": [
    { "word": "ALGORITM", "hint": "Dasturning mantiqiy ketma-ketligi" }
  ]
}

6. Jamoaviy qutqaruv (Team Mode): Murakkablik darajasi yuqori bo'lgan klassik quiz savollari.
{
  "type": "team",
  "data": [
    {
      "question": "Qiyin savol matni",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 2
    }
  ]
}`;

export type GameModeType = 'classic' | 'order' | 'match' | 'truefalse' | 'anagram' | 'team';

/**
 * Helper function to generate game questions using Groq AI
 * @param topic The topic or subject for the questions
 * @param mode The specific game mode specification
 * @param language Language requested (Uzbek, Russian, English)
 * @param count Number of items/questions to generate
 * @returns Parsed JSON array/object of generated questions
 */
export async function generateGameQuestions(topic: string, mode: GameModeType, language: string = 'Uzbek', count: number = 5) {
  try {
    const prompt = `Mavzu: "${topic}". 
Til: ${language}. 
O'yin turi: ${mode}. 
Soni: ${count} ta.
Zukkoo AI Content Engine spesifikatsiyasi bo'yicha JSON formatida qat'iy javob ber.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      // Recommended models for JSON/Logic parsing:
      // "llama3-70b-8192" or "mixtral-8x7b-32768"
      model: "llama3-70b-8192",
      temperature: 0.3, // Lower temperature for structured, reliable JSON output
      response_format: { type: "json_object" }, // Enforce JSON response if supported
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error("AI ta'minotidan javob olinmadi.");
    }

    // Return parsed JSON
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("Error generating questions with Groq:", error);
    throw error;
  }
}
