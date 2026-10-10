import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, Clock, FileText, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { getStudentVirtualExams, startExamAttempt } from "@/lib/nour/virtual-exam.functions";
import { ErrorPanel, errMsg } from "./Shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentVirtualExams({ studentName }: { studentName: string }) {
  const fetch = useServerFn(getStudentVirtualExams);
  const start = useServerFn(startExamAttempt);
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["student-virtual-exams", studentName], queryFn: () => fetch({ data: { studentName } }) });

  async function go(examId: string) {
    if (busy) return;
    setBusy(examId);
    try {
      const r = await start({ data: { examId, studentName } });
      navigate({ to: "/student/virtual-exam/$attemptId", params: { attemptId: r.attemptId } });
    } catch (e) {
      toast.error(errMsg(e));
      setBusy(null);
      q.refetch();
    }
  }

  return (
    <section aria-label="My Virtual Exams" className="space-y-3">
      <h2 className="flex items-center gap-2 text-2xl"><FileText className="h-6 w-6" /> My Virtual Exams</h2>
      {q.isLoading && <Skeleton className="h-24 bg-midnight-soft" />}
      {q.isError && <ErrorPanel message="Couldn't load your virtual exams." onRetry={() => q.refetch()} />}
      {q.data?.length === 0 && <p className="text-sm text-midnight-foreground/70">No virtual exams assigned yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.data?.map((e) => (
          <article key={e.id} className="rounded-lg bg-card p-4 text-card-foreground shadow-soft">
            {e.subject && <span className="rounded-md border-2 border-ink bg-secondary px-2 py-0.5 text-xs font-bold">{e.subject}</span>}
            <h3 className="mt-2 text-lg font-bold">{e.title}</h3>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {e.durationMinutes} min</span>
              <span>{e.questionCount} questions</span>
              <span>Attempts {e.used}/{e.maxAttempts}</span>
              {e.dueAt && <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Due {new Date(e.dueAt).toLocaleString()}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {e.liveAttemptId ? (
                <Button size="sm" asChild><Link to="/student/virtual-exam/$attemptId" params={{ attemptId: e.liveAttemptId }}><Play /> Resume exam</Link></Button>
              ) : e.canStart ? (
                <Button size="sm" disabled={!!busy} onClick={() => go(e.id)}>{busy === e.id ? <Loader2 className="animate-spin" /> : <Play />} {e.used ? "Start new attempt" : "Start exam"}</Button>
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">{e.blockedReason}</span>
              )}
              {e.lastSubmittedId && <Button size="sm" variant="outline" asChild><Link to="/student/virtual-report/$attemptId" params={{ attemptId: e.lastSubmittedId }}>View report</Link></Button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
