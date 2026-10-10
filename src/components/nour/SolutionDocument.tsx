import { useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Eye, PenLine, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blockExplanationInsertion } from "@/lib/nour/explanation-input";
import { insertSolutionSymbol, MAX_SOLUTION_LENGTH } from "@/lib/nour/solution";

const SYMBOLS = [
  ["Fraction", "$\\frac{a}{b}$", "a/b"], ["Square root", "$\\sqrt{x}$", "√"],
  ["Power", "$x^{2}$", "x²"], ["Subscript", "$x_{1}$", "x₁"],
  ["Integral", "$\\int_{a}^{b} f(x)\\,dx$", "∫"], ["Sum", "$\\sum_{i=1}^{n} x_i$", "Σ"],
  ["Multiply", "×", "×"], ["Divide", "÷", "÷"], ["Plus or minus", "±", "±"],
  ["Pi", "π", "π"], ["Infinity", "∞", "∞"], ["Not equal", "≠", "≠"],
  ["Less than or equal", "≤", "≤"], ["Greater than or equal", "≥", "≥"],
  ["Approximately", "≈", "≈"], ["Delta", "Δ", "Δ"], ["Theta", "θ", "θ"],
  ["Degree", "°", "°"], ["Reaction arrow", "→", "→"], ["Equilibrium", "⇌", "⇌"],
] as const;

export function SolutionView({ text }: { text: string }) {
  return <div className="solution-paper whitespace-pre-wrap break-words p-5 text-lg leading-loose sm:p-8">
    {text ? text.split(/(\$[^$\n]+\$)/g).map((part, i) => {
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        try {
          const html = katex.renderToString(part.slice(1, -1), { throwOnError: true, trust: false, output: "htmlAndMathml" });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch { return <span key={i}>{part}</span>; }
      }
      return <span key={i}>{part}</span>;
    }) : <span className="text-muted-foreground">No written solution saved.</span>}
  </div>;
}

export function SolutionDocument({ value, onChange, math, disabled, saveStatus, onSave }: {
  value: string; onChange: (text: string) => void; math: boolean; disabled: boolean;
  saveStatus: string; onSave: () => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  function insert(symbol: string) {
    const el = input.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = insertSolutionSymbol(value, start, end, symbol);
    if (next.length > MAX_SOLUTION_LENGTH) return;
    onChange(next);
    setPreview(false);
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(start + symbol.length, start + symbol.length); });
  }
  return <div>
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <h2 className="mr-auto text-xl">My written solution</h2>
      <span role="status" className="text-xs text-muted-foreground">{saveStatus}</span>
      <Button size="sm" variant="outline" onClick={() => setPreview(!preview)}>{preview ? <PenLine /> : <Eye />}{preview ? "Write" : "Formatted view"}</Button>
      <Button size="icon" variant="outline" aria-label="Save written solution" title="Save written solution" onClick={onSave} disabled={disabled}><Save /></Button>
    </div>
    {math && <div role="toolbar" aria-label="Math and science keyboard" className="mb-3 flex flex-wrap gap-2 border-b-2 border-border pb-3">
      {SYMBOLS.map(([label, symbol, face]) => <Button key={label} size="sm" variant="outline" className="min-w-10 font-sans text-base" aria-label={label} title={label} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(symbol)}>{face}</Button>)}
    </div>}
    {preview ? <SolutionView text={value} /> : <textarea ref={input} aria-label="Written solution" value={value} onChange={(e) => onChange(e.target.value)} onPaste={blockExplanationInsertion} onDrop={blockExplanationInsertion} disabled={disabled} maxLength={MAX_SOLUTION_LENGTH} placeholder="Write your solution…" className="solution-paper block min-h-[58dvh] w-full resize-y p-5 text-lg leading-loose outline-none sm:p-8" />}
  </div>;
}