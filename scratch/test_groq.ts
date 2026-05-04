import 'dotenv/config';
import Groq from 'groq-sdk';

async function testGroq() {
    const key = process.env.GROQ_API_KEY;
    if (!key) { console.log("No key"); return; }
    
    const client = new Groq({ apiKey: key });
    try {
        const res = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 8000
        });
        console.log("OK", res.choices[0].message.content);
    } catch (e: any) {
        console.log("FAIL", e.message);
    }
}

testGroq();
