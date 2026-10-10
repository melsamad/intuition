import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, House, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getTeacherSession, teacherOverride } from "@/lib/nour/api.functions";
import { normalizeText, type Status } from "@/lib/nour/rules";
import { StatusBadge } from "@/components/nour/Status";
import { QuizCardView } from "@/components/nour/QuizCards";
import { ErrorPanel, TopBar, errMsg } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { SolutionView } from "@/components/nour/SolutionDocument";

export const Route = createFileRoute("/teacher/students/$sessionId")({
  head: () => ({
    meta: [
      { title: "Student session — Intuition" },
      { name: "description", content: "Transcript, evidence quotes, hints and overrides for one teaching session." },
      { property: "og:title", content: "Student session — Intuition" },
      { property: "og:description", content: "Review how a student taught Jonathan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Drill,
});

function copy(t: string) {
  navigator.clipboard.writeText(t).then(() => toast.success("Copied"), () => toast.error("Couldn't copy"));
}

function Drill() {
  const { sessionId } = Route.useParams();
  const fetchIt = useServerFn(getTeacherSession);
  const q = useQuery({ queryKey: ["tsession", sessionId], queryFn: () => fetchIt({ data: { sessionId } }) });
  const d = q.data;

  useEffect(() => {
    if (!d || typeof window === "undefined" || !window.location.hash) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [d]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-night text-midnight-foreground">
        <TopBar tone="light" />
        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <Link to="/teacher" search={d ? { a: d.session.assignmentId } : {}} className="inline-flex items-center gap-1 text-sm text-midnight-foreground/70 hover:text-midnight-foreground">
            <ArrowLeft className="h-4 w-4" /> Class understanding
          </Link>
          {d && (
            <>
              <h1 className="mt-3 flex flex-wrap items-center gap-3 text-3xl font-extrabold">
                {d.session.name}
                {d.session.homeTaughtAt && <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"><House className="h-3.5 w-3.5" /> Taught at home</span>}
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold uppercase", d.session.isSample ? "bg-midnight-soft" : "bg-primary text-primary-foreground")}>
                  {d.session.isSample ? "Sample · fictional" : "Live"}
                </span>
              </h1>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-6">
                <Fact k="Assignment" v={d.session.title} />
                <Fact k="Mode" v={d.session.mode} />
                <Fact k="Started" v={new Date(d.session.startedAt).toLocaleString()} />
                <Fact k="Elapsed" v={d.session.duration ? `${Math.floor(d.session.duration / 60)}m ${d.session.duration % 60}s` : d.session.status === "active" ? "In progress" : "—"} />
                <Fact k="Score (raw / adjusted)" v={d.session.raw === null ? "—" : `${d.session.raw} / ${d.session.adjusted} of ${d.session.total}`} />
                <Fact k="Hints" v={String(d.session.hints)} />
              </dl>
            </>
          )}
        </div>
      </div>
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        {q.isLoading && <Skeleton className="h-96 rounded-3xl lg:col-span-2" />}
        {q.isError && <ErrorPanel className="lg:col-span-2" message={errMsg(q.error)} onRetry={() => q.refetch()} />}
        {d && (
          <>
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Misconceptions</h2>
              {d.confusions.map((c) => <ConfusionCard key={c.scId} c={c} sessionId={sessionId} />)}
              {d.audits.length > 0 && (
                <div className="rounded-3xl bg-card p-5 shadow-soft">
                  <h3 className="font-bold">Override audit log</h3>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {d.audits.map((a) => (
                      <li key={a.id}>{new Date(a.at).toLocaleString()} · {a.actor}: {a.before} → {a.after}{a.note ? ` — “${a.note}”` : ""}</li>
                    ))}
                  </ul>
                </div>
              )}
              <h2 className="pt-2 text-xl font-bold">Jonathan's test sheet</h2>
              <p className="text-sm text-muted-foreground">{d.teacherTest ? "Your test questions." : "Default questions (this assignment has no custom test)."} Updates when you override a status.</p>
              {d.quiz.map((c, i) => <QuizCardView key={c.confusionId} card={c} index={i} />)}
            </section>
            <section>
              <h2 className="mb-3 text-xl font-bold">Student's written solution</h2>
              <SolutionView text={d.solution} />
              <h2 className="mt-6 text-xl font-bold">Transcript</h2>
              {d.turns.length === 0 ? (
                <p className="mt-3 rounded-3xl border border-dashed p-6 text-sm text-muted-foreground">
                  {d.session.isSample ? "Synthetic sample record: no transcript was generated, so none is shown." : "No turns yet."}
                </p>
              ) : (
                <ol className="mt-3 space-y-2 rounded-3xl bg-card p-4 shadow-soft">
                  {d.turns.filter((t) => t.kind !== "solution").map((t) => {
                    const ev = d.confusions.find((c) => c.evidenceTurnId === t.id);
                    return (
                      <li key={t.id} id={`t-${t.id}`} className={cn("rounded-2xl px-3 py-2 text-sm", t.speaker === "student" ? "bg-secondary" : t.speaker === "system" ? "bg-muted text-muted-foreground" : "bg-background", ev && "ring-2 ring-fixed")}>
                        <span className="mr-2 text-xs font-bold uppercase text-muted-foreground">
                          {t.speaker === "student" ? "Student" : t.speaker === "nour" ? "Jonathan" : t.kind === "hint" ? "Hint" : "System"}
                          {t.kind === "nudge" && " · nudge"}
                        </span>
                        {ev?.evidenceQuote ? <Highlighted text={t.text} quote={ev.evidenceQuote} /> : t.text}
                        {ev && <span className="mt-1 block text-xs font-semibold text-fixed-foreground">Evidence for {ev.code}</span>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-midnight-foreground/55">{k}</dt>
      <dd className="font-semibold capitalize-first">{v}</dd>
    </div>
  );
}

/** Safe text rendering: wraps the evidence substring in <mark> without HTML injection. */
function Highlighted({ text, quote }: { text: string; quote: string }) {
  const i = text.toLowerCase().indexOf(quote.toLowerCase());
  if (i < 0) {
    return <mark className="rounded bg-fixed-soft px-0.5 text-fixed-foreground">{text}</mark>;
  }
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-fixed-soft px-0.5 font-semibold text-fixed-foreground">{text.slice(i, i + quote.length)}</mark>
      {text.slice(i + quote.length)}
    </>
  );
}
void normalizeText;

type C = Awaited<ReturnType<typeof getTeacherSession>>["confusions"][number];

function ConfusionCard({ c, sessionId }: { c: C; sessionId: string }) {
  const qc = useQueryClient();
  const save = useServerFn(teacherOverride);
  const [choice, setChoice] = useState<Status | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const eff = c.overrideStatus ?? c.aiStatus;

  async function confirm() {
    if (!choice) return;
    setSaving(true);
    try {
      const r = await save({ data: { scId: c.scId, status: choice, note } });
      toast.success(`Override saved. Score is now ${r.raw} (adjusted ${r.adjusted}).`);
      setChoice(null);
      setNote("");
      await qc.invalidateQueries({ queryKey: ["tsession", sessionId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <article id={`c-${c.code}`} className="scroll-mt-24 rounded-3xl bg-card p-5 shadow-soft target:ring-2 target:ring-primary">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-muted-foreground">{c.code}</p>
          <h3 className="font-bold">{c.title}</h3>
        </div>
        <StatusBadge status={eff} />
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div><dt className="text-muted-foreground">AI decision</dt><dd className="mt-0.5"><StatusBadge status={c.aiStatus} /></dd></div>
        <div><dt className="text-muted-foreground">Attempts</dt><dd className="font-bold">{c.attempts}</dd></div>
        <div><dt className="text-muted-foreground">Hints</dt><dd className="font-bold">{c.hints}{c.nudgeShown ? " · nudged" : ""}</dd></div>
      </dl>
      {c.overrideStatus && (
        <p className="mt-3 rounded-2xl bg-secondary p-3 text-xs">
          <strong>Teacher override:</strong> {c.aiStatus} → {c.overrideStatus}
          {c.overrideNote && <> — “{c.overrideNote}”</>} {c.overriddenAt && <span className="text-muted-foreground">({new Date(c.overriddenAt).toLocaleString()})</span>}
        </p>
      )}
      {c.evidenceQuote ? (
        <div className={cn("mt-3 rounded-2xl p-3 text-sm", c.aiStatus === "taught_wrong" ? "bg-wrong-soft text-wrong-foreground" : "bg-fixed-soft text-fixed-foreground")}>
          <q className="font-semibold">{c.evidenceQuote}</q>
          <div className="mt-2 flex gap-3 text-xs font-semibold">
            {c.evidenceTurnId && <a href={`#t-${c.evidenceTurnId}`} className="underline underline-offset-4">Show in transcript</a>}
            <button onClick={() => copy(c.evidenceQuote!)} className="inline-flex items-center gap-1"><Copy className="h-3.5 w-3.5" /> Copy</button>
          </div>
          {c.reasonSummary && <p className="mt-2 text-xs opacity-80">AI summary: {c.reasonSummary}</p>}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">No evidence quote recorded.</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Override:</span>
        {(["fixed", "locked", "taught_wrong"] as Status[]).map((s) => (
          <Button key={s} size="sm" variant="outline" disabled={s === eff} onClick={() => setChoice(s)}>
            {s === "fixed" ? "Fixed" : s === "locked" ? "Not fixed" : "Taught wrong"}
          </Button>
        ))}
      </div>
      <AlertDialog open={!!choice} onOpenChange={(o) => !o && !saving && setChoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Override {c.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Change from “{eff}” to “{choice}”. The original AI decision is kept and the score will be recalculated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label htmlFor={`note-${c.scId}`} className="text-sm font-semibold">Note (optional)</label>
          <Textarea id={`note-${c.scId}`} value={note} maxLength={280} onChange={(e) => setNote(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirm(); }} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} Save override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
