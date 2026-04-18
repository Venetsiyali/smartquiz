const fs = require('fs');

async function test() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=undefined`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: "hi" }] }]
        })
    });
    console.log(response.status, await response.text());
}
test();
