import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, FileText, Lightbulb, Plus, RefreshCw, Users, House, Trash2 } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteAssignment, getDashboard } from "@/lib/nour/api.functions";
import { STATUS_META, StatusLegend } from "@/components/nour/Status";
import { ErrorPanel, TopBar, errMsg } from "@/components/nour/Shell";
import { Nour } from "@/components/nour/Nour";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/")({
  validateSearch: (s: Record<string, unknown>): { a?: string } => (typeof s["a"] === "string" ? { a: s["a"] } : {}),
  head: () => ({
    meta: [
      { title: "Class understanding — Intuition" },
      { name: "description", content: "A live map of your class's misconceptions, built from what students taught Jonathan." },
      { property: "og:title", content: "Class understanding — Intuition" },
      { property: "og:description", content: "See which ideas to reteach tomorrow, and the best student explanations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { a } = Route.useSearch();
  const navigate = useNavigate({ from: "/teacher/" });
  const fetchDash = useServerFn(getDashboard);
  const q = useQuery({
    queryKey: ["dashboard", a ?? null],
    queryFn: () => fetchDash({ data: { assignmentId: a ?? null } }),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  const d = q.data;
  const sel = d?.selected;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-night text-midnight-foreground">
        <TopBar tone="light" right={<Link to="/student" className="text-sm font-semibold text-midnight-foreground/70 hover:text-midnight-foreground">Student view</Link>} />
        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl">Class understanding</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                {d && d.assignments.length > 0 && (
                  <Select value={sel?.id ?? ""} onValueChange={(v) => navigate({ search: { a: v } })}>
                    <SelectTrigger className="w-[min(22rem,80vw)] border-midnight-foreground/20 bg-midnight-soft text-midnight-foreground" aria-label="Assignment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {d.assignments.map((x) => (
                        <SelectItem key={x.id} value={x.id}>{x.title}{x.isActive ? "" : " (inactive)"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {sel && <DeleteLesson id={sel.id} title={sel.title} onDeleted={() => { navigate({ search: {} }); q.refetch(); }} />}
                {sel && <span className="rounded-full bg-midnight-soft px-3 py-1 text-xs font-semibold capitalize">{sel.mode}</span>}
                <button onClick={() => q.refetch()} className="inline-flex items-center gap-1 text-xs text-midnight-foreground/60 hover:text-midnight-foreground">
                  <RefreshCw className={cn("h-3.5 w-3.5", q.isFetching && "animate-spin")} />
                  {d ? `Updated ${new Date(d.fetchedAt ?? Date.now()).toLocaleTimeString()}` : "Loading"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="glow"><Link to="/teacher/assignments/new"><Plus /> Create assignment</Link></Button>
              <Button asChild variant="night"><Link to="/teacher/topics/new"><Plus /> Add topic</Link></Button>
              <Button asChild variant="night"><Link to="/teacher/virtual-exams"><FileText /> Virtual exams</Link></Button>
              <Button variant="night" onClick={() => document.getElementById("heatmap")?.scrollIntoView({ behavior: "smooth" })}><Users /> View student sessions</Button>
            </div>
          </div>
          <p className="mt-6 rounded-2xl border border-pending/50 bg-pending/15 px-4 py-2 text-xs font-bold tracking-wide text-pending">
            DEMO DATA — sample students are fictional; any live session is shown separately.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {q.isLoading && <Skeleton className="h-96 rounded-3xl" />}
        {q.isError && <ErrorPanel message={errMsg(q.error)} onRetry={() => q.refetch()} />}
        {d && !sel && (
          <div className="rounded-3xl border border-dashed p-10 text-center">
            <Nour mood="curious" size={72} />
            <p className="mt-3 font-semibold">No assignments yet.</p>
            <Button asChild className="mt-4"><Link to="/teacher/assignments/new">Create the first one</Link></Button>
          </div>
        )}
        {sel && (
          <>
            {sel.insight && (
              <section className="flex items-start gap-4 rounded-3xl bg-card p-6 shadow-soft">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orb text-midnight shadow-glow"><Lightbulb className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tomorrow's insight</p>
                  <p className="mt-1 font-display text-xl font-bold sm:text-2xl">{sel.insight}</p>
                </div>
              </section>
            )}
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="Students represented" value={sel.metrics.students} sub={`${sel.metrics.sampleCount} sample · ${sel.metrics.students - sel.metrics.sampleCount} live`} />
              <Metric label="Need reteaching" value={sel.metrics.needReteach} sub={`of ${sel.metrics.total} misconceptions`} />
              <Metric label="Sessions" value={sel.metrics.completed} sub={`completed · ${sel.metrics.live} in progress`} />
              <Metric label="Average Jonathan score" value={sel.metrics.avg === null ? "—" : sel.metrics.avg.toFixed(1)} sub={`out of ${sel.metrics.total}`} />
            </section>

            <section id="heatmap" className="rounded-3xl bg-card p-4 shadow-soft sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">Misconception heatmap</h2>
                <StatusLegend />
              </div>
              {sel.rows.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">No sessions yet for this assignment.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] border-separate border-spacing-y-1 text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="px-2 py-2 font-semibold">Student</th>
                        {sel.confusions.map((c) => (
                          <th key={c.id} className="px-1 py-2 font-semibold" title={c.title}>
                            <span className="block font-bold text-foreground">{c.code}</span>
                            <span className="line-clamp-1 font-normal">{c.title}</span>
                          </th>
                        ))}
                        <th className="px-2 py-2 text-right font-semibold">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...sel.rows].sort((x, y) => Number(x.isSample) - Number(y.isSample)).map((r) => (
                        <tr key={r.sessionId} className="group">
                          <td className="rounded-l-xl bg-muted/50 px-2 py-1.5">
                            <Link to="/teacher/students/$sessionId" params={{ sessionId: r.sessionId }} className="font-semibold hover:text-primary">
                              {r.name}
                            </Link>
                            {r.homeTaught && <House className="ml-1 inline h-3.5 w-3.5 text-primary" aria-label="Taught at home" />}
                            <span className={cn("ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", r.isSample ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")}>
                              {r.isSample ? "Sample" : r.completed ? "Live" : "Live · in progress"}
                            </span>
                          </td>
                          {r.cells.map((c, ci) => {
                            const m = STATUS_META[c.status];
                            return (
                              <td key={c.confusionId} className="bg-muted/50 px-1 py-1.5">
                                <Link
                                  to="/teacher/students/$sessionId"
                                  params={{ sessionId: r.sessionId }}
                                  hash={`c-${sel.confusions[ci]?.code ?? ""}`}
                                  className={cn("flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold", m.cls)}
                                  aria-label={`${r.name}, ${m.label}${c.overridden ? ", teacher override" : ""}`}
                                >
                                  <m.Icon className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">{m.label}</span>
                                  {c.overridden && <span className="ml-auto text-[10px]">T</span>}
                                </Link>
                              </td>
                            );
                          })}
                          <td className="rounded-r-xl bg-muted/50 px-2 py-1.5 text-right font-bold tabular-nums">
                            {r.completed ? `${r.score ?? 0}/${r.total}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold">Best explanations</h2>
              <p className="text-sm text-muted-foreground">Exact quotes from live students that convinced Jonathan. Sample students have no transcripts.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {sel.best.map((b) => (
                  <div key={b.confusionId} className="rounded-3xl bg-card p-5 shadow-soft">
                    <p className="text-xs font-bold text-muted-foreground">{b.code}</p>
                    <p className="font-bold">{b.title}</p>
                    {b.quotes.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">No live explanations yet. They'll appear here as students fix this idea.</p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {b.quotes.map((x) => (
                          <li key={x.sessionId} className="rounded-2xl bg-fixed-soft p-3 text-sm text-fixed-foreground">
                            <q className="font-semibold">{x.quote}</q>
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <Link to="/teacher/students/$sessionId" params={{ sessionId: x.sessionId }} className="underline-offset-4 hover:underline">— {x.name}</Link>
                              <button
                                className="inline-flex items-center gap-1 font-semibold"
                                onClick={() => navigator.clipboard.writeText(x.quote).then(() => toast.success("Copied"), () => toast.error("Couldn't copy"))}
                                aria-label="Copy explanation"
                              >
                                <Copy className="h-3.5 w-3.5" /> Copy
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        <p className="text-center text-xs text-muted-foreground">
          Want a new topic? <Link to="/teacher/topics/new" className="font-semibold text-primary underline-offset-4 hover:underline">Draft one with AI</Link> (teacher review required).
        </p>
      </main>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-soft">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function DeleteLesson({ id, title, onDeleted }: { id: string; title: string; onDeleted: () => void }) {
  const del = useServerFn(deleteAssignment);
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="inline-flex items-center gap-1 rounded-full bg-midnight-soft px-3 py-1 text-xs font-semibold text-midnight-foreground/80 hover:text-wrong" aria-label="Delete this lesson">
          <Trash2 className="h-3.5 w-3.5" /> Delete lesson
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{title}"?</AlertDialogTitle>
          <AlertDialogDescription>This removes the lesson and every student session in it. This can't be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await del({ data: { assignmentId: id } });
                toast.success("Lesson deleted.");
                onDeleted();
              } catch (e) {
                toast.error(errMsg(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Delete lesson
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
