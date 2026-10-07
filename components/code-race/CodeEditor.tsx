'use client';

import dynamic from 'next/dynamic';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

// CodeMirror faqat shu o'yin sahifasida yuklanadi — platformaning boshqa sahifalari og'irlashmaydi
const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
    ssr: false,
    loading: () => <div className="h-full min-h-[260px] rounded-xl bg-[#282c34] animate-pulse" />,
});

const extensions = [python()];

export default function CodeEditor({ value, onChange, onRun }: { value: string; onChange: (v: string) => void; onRun?: () => void }) {
    return (
        <div className="h-full rounded-xl overflow-hidden border border-white/10 text-[15px]"
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onRun?.(); } }}>
            <CodeMirror
                value={value}
                onChange={onChange}
                theme={oneDark}
                extensions={extensions}
                height="100%"
                style={{ height: '100%' }}
                basicSetup={{ lineNumbers: true, foldGutter: false, autocompletion: true, highlightActiveLine: true, tabSize: 4 }}
            />
        </div>
    );
}
