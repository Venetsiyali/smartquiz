const fs = require('fs');

async function test() {
    const systemPrompt = "Sen o'zbek tilidagi tarixiy savollar bo'yicha ekspert";
    const currentUserPrompt = "Menga Xorazm tarixi bo'yicha 5 ta test savoli tuz. Format: json";

    const key = "AIzaSyD4ol5DdZPy0g8sDhjHjKPNkYfa3XuMCVA"; 
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${currentUserPrompt}\n\nIMPORTANT: Return ONLY valid JSON format without any markdown code block wrappers (do not use \`\`\`json). I will parse the raw response with JSON.parse().` }] }],
            generationConfig: { temperature: 0.85, responseMimeType: "application/json" }
        })
    });
    
    if (!response.ok) {
        console.error("Error:", response.status, await response.text());
        return;
    }
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

test();
