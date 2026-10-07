'use client';

import type { CodeTest } from './codeRace';

export interface TestResult { ok: boolean; got?: string; error?: string }
export interface RunResult { output: string; error?: string; results?: TestResult[]; timedOut?: boolean }

const TIMEOUT_MS = 5_000;

/**
 * Python'ni Web Worker ichida ishga tushiradi. Kod 5 soniyadan uzoq ishlasa (masalan, cheksiz tsikl),
 * worker to'xtatiladi va yangisi yaratiladi — sahifa hech qachon qotmaydi.
 */
export class PyRunner {
    private worker!: Worker;
    private readyPromise!: Promise<void>;
    private seq = 0;
    private pending = new Map<number, (r: RunResult) => void>();
    onStatus?: (s: 'loading' | 'ready' | 'error') => void;

    constructor(onStatus?: PyRunner['onStatus']) {
        this.onStatus = onStatus;
        this.spawn();
    }

    private spawn() {
        this.onStatus?.('loading');
        this.worker = new Worker('/pyodide-worker.js');
        this.readyPromise = new Promise((resolve, reject) => {
            this.worker.onmessage = ({ data }) => {
                if (data.type === 'ready') { this.onStatus?.('ready'); resolve(); return; }
                if (data.type === 'load-error') { this.onStatus?.('error'); reject(new Error(data.error)); return; }
                if (data.type === 'done') {
                    this.pending.get(data.id)?.(data);
                    this.pending.delete(data.id);
                }
            };
            this.worker.onerror = () => { this.onStatus?.('error'); reject(new Error("Python yuklanmadi")); };
        });
    }

    get ready() { return this.readyPromise; }

    private send(msg: object): Promise<RunResult> {
        return this.readyPromise.then(() => new Promise<RunResult>(resolve => {
            const id = ++this.seq;
            const timer = setTimeout(() => {
                this.pending.delete(id);
                this.worker.terminate();
                this.spawn();
                resolve({ output: '', timedOut: true, error: "⏱ Kod 5 soniyadan uzoq ishladi — cheksiz tsikl yo'qligini tekshiring" });
            }, TIMEOUT_MS);
            this.pending.set(id, r => { clearTimeout(timer); resolve(r); });
            this.worker.postMessage({ ...msg, id });
        }));
    }

    run(code: string) { return this.send({ type: 'run', code }); }

    test(code: string, functionName: string, tests: CodeTest[]) {
        return this.send({ type: 'test', code, functionName, tests });
    }

    dispose() { this.worker.terminate(); this.pending.clear(); }
}
