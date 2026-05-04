
import { Groq } from 'groq-sdk';

async function test() {
    const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS?.split(',')[0];
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS?.split(',')[0];

    console.log('--- ENV CHECK ---');
    console.log('GROQ_KEY set:', !!groqKey);
    console.log('GEMINI_KEY set:', !!geminiKey);

    if (groqKey) {
        try {
            const groq = new Groq({ apiKey: groqKey.trim() });
            const res = await groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 5
            });
            console.log('GROQ OK:', res.choices[0].message.content);
        } catch (e: any) {
            console.log('GROQ FAIL:', e.message);
        }
    }

    if (geminiKey) {
        try {
            const model = 'gemini-1.5-flash';
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'hi' }] }]
                })
            });
            if (res.ok) {
                const data = await res.json();
                console.log('GEMINI OK:', data.candidates?.[0]?.content?.parts?.[0]?.text);
            } else {
                console.log('GEMINI FAIL:', res.status, await res.text());
            }
        } catch (e: any) {
            console.log('GEMINI FETCH FAIL:', e.message);
        }
    }
}

test();
