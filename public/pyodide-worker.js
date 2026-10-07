/* Kod Cho'qqisi — Python'ni talaba brauzerida alohida oqimda ishga tushiradi (sahifa qotib qolmasligi uchun).
 * Asosiy oqim cheksiz tsiklda ushbu worker'ni to'xtatib (terminate) yangisini yaratadi. */
importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');

const MAX_OUTPUT = 10000;

const HARNESS = `
import json as __json
def __eq(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        return type(a) is type(b) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return abs(a - b) < 1e-6
    if isinstance(a, (list, tuple)) and isinstance(b, list):
        return len(a) == len(b) and all(__eq(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return set(map(str, a.keys())) == set(b.keys()) and all(__eq(a[k], b[str(k)]) for k in a)
    return a == b
__fn = globals().get(__FN)
if not callable(__fn):
    raise NameError(f"'{__FN}' nomli funksiya topilmadi — def {__FN}(...): deb yozing")
__out = []
for __t in __json.loads(__TESTS):
    try:
        __got = __fn(*__t['args'])
        __out.append({'ok': __eq(__got, __t['expected']), 'got': repr(__got)[:300]})
    except Exception as __e:
        __out.append({'ok': False, 'error': f"{type(__e).__name__}: {__e}"})
__json.dumps(__out)
`;

const INPUT_STUB = `
def input(*args):
    raise RuntimeError("input() bu o'yinda ishlamaydi — qiymatlar funksiya parametrlari orqali keladi")
`;

let pyodide;
let output = '';
const write = s => { if (output.length < MAX_OUTPUT) output += s + '\n'; };

const ready = loadPyodide().then(p => {
    pyodide = p;
    pyodide.setStdout({ batched: write });
    pyodide.setStderr({ batched: write });
    postMessage({ type: 'ready' });
}).catch(err => postMessage({ type: 'load-error', error: String(err) }));

// Pyodide'ning ichki qatorlarini olib tashlab, faqat talaba kodiga tegishli xatoni qoldiradi
function cleanError(err) {
    const lines = String(err && err.message || err).trim().split('\n');
    if (lines[lines.length - 1].includes('nomli funksiya topilmadi')) return lines[lines.length - 1];
    const start = lines.findIndex(l => l.includes('File "<exec>"'));
    return (start >= 0 ? lines.slice(start) : lines.slice(-3)).join('\n').replace(/File "<exec>"/g, 'Kodingiz');
}

self.onmessage = async ({ data }) => {
    await ready;
    if (!pyodide) return;
    const { id, code, functionName, tests } = data;
    output = '';
    const ns = pyodide.globals.get('dict')();
    try {
        pyodide.runPython(INPUT_STUB, { globals: ns });
        await pyodide.runPythonAsync(code, { globals: ns });
        if (data.type === 'test') {
            ns.set('__FN', functionName);
            ns.set('__TESTS', JSON.stringify(tests));
            const results = JSON.parse(pyodide.runPython(HARNESS, { globals: ns }));
            postMessage({ type: 'done', id, output: output.slice(0, MAX_OUTPUT), results });
        } else {
            postMessage({ type: 'done', id, output: output.slice(0, MAX_OUTPUT) });
        }
    } catch (err) {
        postMessage({ type: 'done', id, output: output.slice(0, MAX_OUTPUT), error: cleanError(err) });
    } finally {
        ns.destroy();
    }
};
