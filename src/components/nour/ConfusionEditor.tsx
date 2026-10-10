import { Plus, Trash2 } from "lucide-react";
import type { ConfusionDraft } from "@/lib/nour/api.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const emptyConfusion = (n: number): ConfusionDraft => ({
  originalId: null,
  code: `M${n}`,
  title: "",
  nour_says: "",
  accepted_reasons: [""],
  quiz_question: "",
  answer_if_fixed: "",
  answer_if_not: "",
  short_explanation: "",
  hint: "",
  nudge: "",
});

const FIELDS: { k: keyof ConfusionDraft; label: string; long?: boolean }[] = [
  { k: "title", label: "Title" },
  { k: "nour_says", label: "Jonathan says (the wrong idea)", long: true },
  { k: "quiz_question", label: "New-context quiz question", long: true },
  { k: "answer_if_fixed", label: "Jonathan's answer if fixed" },
  { k: "answer_if_not", label: "Jonathan's answer if not fixed" },
  { k: "short_explanation", label: "Short explanation (shown after the quiz)" },
  { k: "hint", label: "Stuck? hint (conceptual, no script)" },
  { k: "nudge", label: "Nudge after 3 failed attempts" },
];

export function ConfusionEditor({ list, onChange }: { list: ConfusionDraft[]; onChange: (l: ConfusionDraft[]) => void }) {
  const set = (i: number, patch: Partial<ConfusionDraft>) => onChange(list.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <div className="space-y-4">
      {list.map((c, i) => (
        <fieldset key={i} className="rounded-3xl border bg-card p-5">
          <legend className="sr-only">Misconception {i + 1}</legend>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold">#{i + 1} · {c.code}</span>
            <Button type="button" variant="ghost" size="sm" disabled={list.length <= 1} onClick={() => onChange(list.filter((_, j) => j !== i))}>
              <Trash2 /> Remove
            </Button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.k} className={f.long ? "sm:col-span-2" : ""}>
                <span className="text-xs font-semibold text-muted-foreground">{f.label}</span>
                {f.long ? (
                  <Textarea className="mt-1" value={c[f.k] as string} onChange={(e) => set(i, { [f.k]: e.target.value })} />
                ) : (
                  <Input className="mt-1" value={c[f.k] as string} onChange={(e) => set(i, { [f.k]: e.target.value })} />
                )}
              </label>
            ))}
            <div className="sm:col-span-2">
              <span className="text-xs font-semibold text-muted-foreground">Accepted reasons (what convinces Jonathan)</span>
              <div className="mt-1 space-y-2">
                {c.accepted_reasons.map((r, k) => (
                  <div key={k} className="flex gap-2">
                    <Input value={r} aria-label={`Accepted reason ${k + 1}`} onChange={(e) => set(i, { accepted_reasons: c.accepted_reasons.map((x, m) => (m === k ? e.target.value : x)) })} />
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove reason" disabled={c.accepted_reasons.length <= 1} onClick={() => set(i, { accepted_reasons: c.accepted_reasons.filter((_, m) => m !== k) })}>
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => set(i, { accepted_reasons: [...c.accepted_reasons, ""] })}>
                  <Plus /> Add reason
                </Button>
              </div>
            </div>
          </div>
        </fieldset>
      ))}
      <Button type="button" variant="outline" disabled={list.length >= 5} onClick={() => onChange([...list, emptyConfusion(list.length + 1)])}>
        <Plus /> Add misconception
      </Button>
    </div>
  );
}
