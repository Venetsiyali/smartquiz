const fs = require('fs');

async function test() {
    const key = "AIzaSyD4ol5DdZPy0g8sDhjHjKPNkYfa3XuMCVA"; // provided by user
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `Hello, return a json object with a "test" field.` }] }],
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
