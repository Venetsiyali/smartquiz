/** AI javobidan JSON massivni ```json fence, qavslar va trailing comma'lardan tozalab ajratib oladi. */
export function extractJsonArray(raw: string): any[] {
    let text = raw.trim();
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1].trim();

    const arrStart = text.indexOf('[');
    const objStart = text.indexOf('{');
    const start = arrStart === -1 ? objStart : (objStart === -1 ? arrStart : Math.min(arrStart, objStart));
    if (start === -1) throw new Error('JSON topilmadi');

    const cleaned = text.slice(start)
        .replace(/[“”„«»]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/,\s*([}\]])/g, '$1');

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.questions)) return parsed.questions;
    throw new Error('JSON massiv formatida emas');
}
