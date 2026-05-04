import 'dotenv/config';

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) { console.log("No key"); return; }
    
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        console.log(res.status);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.log(e.message);
    }
}

listModels();
