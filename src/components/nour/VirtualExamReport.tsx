import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Lightbulb, Loader2, Quote, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getExamAttempt, regenerateExamReport, type ReportItem } from "@/lib/nour/virtual-exam.functions";
import { SolutionView } from "./SolutionDocument";
import { ErrorPanel, errMsg } from "./Shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const fmtDuration = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};

export function VirtualExamReport({ attemptId, viewer }: { attemptId: string; viewer: "student" | "teacher" }) {
  const fetchAttempt = useServerFn(getExamAttempt);
  const regen = useServerFn(regenerateExamReport);
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["virtual-attempt", attemptId],
    queryFn: () => fetchAttempt({ data: { attemptId } }),
    refetchInterval: (query) => (query.state.data?.attempt.reportStatus === "pending" ? 4000 : false),
  });
  if (q.isLoading) return <Skeleton className="h-96 rounded-lg" />;
  if (q.isError || !q.data) return <ErrorPanel message={errMsg(q.error)} onRetry={() => q.refetch()} />;
  const { exam, attempt, recordings } = q.data;
  const r = attempt.report;
  const maxMs = Math.max(1, ...(r?.timing ?? []).map((t) => t.estimatedMs));

  async function retry() {
    setBusy(true);
    try { await regen({ data: { attemptId } }); await q.refetch(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-8">
      <header className="rounded-lg bg-card p-6 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{exam.subject || "Virtual exam"} · Attempt {attempt.attemptNumber} of {exam.maxAttempts}</p>
        <h1 className="mt-1 text-3xl">{exam.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {viewer === "teacher" ? `${attempt.studentName} · ` : ""}Submitted {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "—"}
          {attempt.autoSubmitted && <span className="ml-2 rounded-md border-2 border-border bg-pending px-2 py-0.5 text-xs font-bold text-ink">Auto-submitted when time ran out</span>}
        </p>
      </header>

      {attempt.status !== "submitted" && <ErrorPanel message="This attempt is still in progress. The report appears after submission." />}

      {attempt.status === "submitted" && attempt.reportStatus === "pending" && (
        <div className="flex items-center gap-3 rounded-lg bg-card p-6 shadow-soft"><Loader2 className="h-5 w-5 animate-spin" /> Writing the feedback report…</div>
      )}
      {attempt.reportStatus === "failed" && (
        <div className="rounded-lg bg-wrong-soft p-6 shadow-soft">
          <p className="font-semibold">The feedback report couldn't be generated{attempt.reportError ? `: ${attempt.reportError}` : "."}</p>
          <Button className="mt-3" onClick={retry} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Try again</Button>
        </div>
      )}

      {r && (
        <>
          <section className="rounded-lg bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="mr-auto text-2xl">Feedback report</h2>
              <Legend />
            </div>
            <p className="mt-3 text-lg leading-relaxed">{r.summary}</p>
            {viewer === "teacher" && <Button variant="outline" size="sm" className="mt-4" onClick={retry} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Regenerate</Button>}
          </section>

          <section className="rounded-lg bg-card p-6 shadow-soft">
            <h2 className="text-xl">Time per question</h2>
            <p className="mt-1 text-xs text-muted-foreground">Recorded time is measured. The rest of the exam time is estimated from how much was written and said for each question.</p>
            <ul className="mt-4 space-y-3">
              {r.timing.map((t) => (
                <li key={t.question} className="grid grid-cols-[5.5rem_1fr_6rem] items-center gap-3 text-sm">
                  <span className="font-bold">Question {t.question}</span>
                  <div className="h-5 overflow-hidden rounded-md border-2 border-border bg-muted">
                    <div className="h-full bg-chart-1" style={{ width: `${(t.estimatedMs / maxMs) * 100}%` }} />
                  </div>
                  <span className="text-right tabular-nums">~{fmtDuration(t.estimatedMs)}<span className="block text-xs text-muted-foreground">{fmtDuration(t.recordedMs)} recorded</span></span>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <ItemList title="Strengths" icon={<CheckCircle2 className="h-5 w-5" />} tone="bg-fixed" items={r.strengths} empty="No clear strengths could be identified." />
            <ItemList title="Unclear reasoning" icon={<HelpCircle className="h-5 w-5" />} tone="bg-pending" items={r.unclear_reasoning} empty="Nothing stood out as unclear." />
            <ItemList title="Potential misconceptions" icon={<AlertTriangle className="h-5 w-5" />} tone="bg-wrong" items={r.misconceptions} empty="No potential misconceptions found." />
          </div>

          <section className="rounded-lg bg-card p-6 shadow-soft">
            <h2 className="flex items-center gap-2 text-xl"><Lightbulb className="h-5 w-5" /> What to do next</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-6">{r.recommendations.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </section>
        </>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl">Work by question</h2>
        {Array.from({ length: exam.questionCount }, (_, i) => i + 1).map((n) => {
          const recs = recordings.filter((x) => x.questionNumber === n);
          const note = attempt.notes[String(n)] ?? "";
          return (
            <article key={n} className="rounded-lg bg-card p-5 shadow-soft">
              <h3 className="text-lg font-bold">Question {n}</h3>
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                <div><p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Written</p>{note ? <SolutionView text={note} /> : <p className="text-sm text-muted-foreground">Nothing written.</p>}</div>
                <div className="space-y-3"><p className="text-xs font-bold uppercase text-muted-foreground">Spoken ({recs.length})</p>
                  {recs.length === 0 && <p className="text-sm text-muted-foreground">No recordings.</p>}
                  {recs.map((x) => (
                    <div key={x.id} className="rounded-md border-2 border-border p-3">
                      {x.url && <audio controls preload="none" src={x.url} className="w-full" />}
                      <p className="mt-2 text-xs text-muted-foreground">{fmtDuration(x.durationMs)}</p>
                      <p className="mt-1 text-sm">{x.transcriptStatus === "done" ? x.transcript || "(no speech detected)" : x.transcriptStatus === "failed" ? "Transcript unavailable." : "Transcribing…"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Legend() {
  return <div className="flex flex-wrap gap-2 text-xs font-bold">
    <span className="inline-flex items-center gap-1 rounded-md border-2 border-border bg-fixed px-2 py-0.5 text-ink"><Quote className="h-3 w-3" /> Evidence: quoted from your work</span>
    <span className="inline-flex items-center gap-1 rounded-md border-2 border-dashed border-border bg-background px-2 py-0.5"><Sparkles className="h-3 w-3" /> AI inference: uncertain</span>
  </div>;
}

function ItemList({ title, icon, tone, items, empty }: { title: string; icon: React.ReactNode; tone: string; items: ReportItem[]; empty: string }) {
  return (
    <section className="rounded-lg bg-card p-5 shadow-soft">
      <h3 className="flex items-center gap-2 text-lg font-bold"><span className={cn("grid h-8 w-8 place-items-center rounded-md border-2 border-border text-ink", tone)}>{icon}</span>{title}</h3>
      {items.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{empty}</p> : (
        <ul className="mt-3 space-y-3">
          {items.map((it, i) => (
            <li key={i} className={cn("rounded-md border-2 p-3 text-sm", it.basis === "evidence" ? "border-border" : "border-dashed border-border/60")}>
              <div className="mb-1 flex flex-wrap gap-2 text-[11px] font-bold uppercase">
                <span className={cn("rounded px-1.5", it.basis === "evidence" ? "bg-fixed text-ink" : "bg-muted")}>{it.basis === "evidence" ? "Evidence" : "AI inference"}</span>
                {it.question && <span className="rounded bg-muted px-1.5">Q{it.question}</span>}
              </div>
              <p>{it.text}</p>
              {it.evidence_quote && <blockquote className="mt-2 border-l-4 border-chart-1 pl-2 italic text-muted-foreground">“{it.evidence_quote}”</blockquote>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
