import 'dotenv/config';

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log("No key found");
        return;
    }
    
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-1.0-pro',
        'gemini-1.5-flash-latest',
        'gemini-pro'
    ];
    
    for (const m of models) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
            });
            console.log(m, res.status, await res.text());
        } catch (e: any) {
            console.log(m, 'FAIL', e.message);
        }
    }
}

testGemini();
