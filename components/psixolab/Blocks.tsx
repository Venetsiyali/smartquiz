import type { AudBlock } from '@/lib/psixolab/auditoriya';

/** Tushuntirish matni: xatboshilar va roʻyxatlar. */
export default function Blocks({ blocks }: { blocks: AudBlock[] }) {
    return (
        <div className="space-y-3 text-white/85 leading-relaxed">
            {blocks.map((b, i) => 'p' in b
                ? <p key={i}>{b.p}</p>
                : <ul key={i} className="list-disc pl-5 space-y-1">{b.ul.map((x, j) => <li key={j}>{x}</li>)}</ul>)}
        </div>
    );
}
