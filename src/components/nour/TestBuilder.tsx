import { Plus, Trash2 } from "lucide-react";
import type { ConfusionDraft } from "@/lib/nour/api.functions";
import type { TestQuestion } from "@/lib/nour/rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Teacher writes the test Jonathan will take after being taught. */
export function TestBuilder({ list, onChange, confusions }: { list: TestQuestion[]; onChange: (l: TestQuestion[]) => void; confusions: ConfusionDraft[] }) {
  const set = (i: number, p: Partial<TestQuestion>) => onChange(list.map((q, j) => (j === i ? { ...q, ...p } : q)));
  const first = confusions[0]?.code ?? "";
  return (
    <div className="space-y-4">
      {list.map((q, i) => (
        <fieldset key={i} className="rounded-3xl border bg-card p-5">
          <legend className="sr-only">Test question {i + 1}</legend>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold">Question {i + 1}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(list.filter((_, j) => j !== i))}><Trash2 /> Remove</Button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold text-muted-foreground">Which misconception does it test?</span>
              <Select value={q.code} onValueChange={(v) => set(i, { code: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  {confusions.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} · {c.title || "Untitled"}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold text-muted-foreground">Question</span>
              <Textarea className="mt-1" required value={q.question} onChange={(e) => set(i, { question: e.target.value })} placeholder="Which is larger: 3/4 or 5/8?" />
            </label>
            <label>
              <span className="text-xs font-semibold text-muted-foreground">Correct answer (if taught well)</span>
              <Input className="mt-1" required value={q.correct_answer} onChange={(e) => set(i, { correct_answer: e.target.value })} />
            </label>
            <label>
              <span className="text-xs font-semibold text-muted-foreground">Trap answer (if still confused)</span>
              <Input className="mt-1" required value={q.trap_answer} onChange={(e) => set(i, { trap_answer: e.target.value })} />
            </label>
          </div>
        </fieldset>
      ))}
      <Button type="button" variant="outline" disabled={list.length >= 20 || !first} onClick={() => onChange([...list, { code: first, question: "", correct_answer: "", trap_answer: "" }])}>
        <Plus /> Add test question
      </Button>
    </div>
  );
}
