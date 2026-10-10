import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { getVirtualExamAttempts } from "@/lib/nour/virtual-exam.functions";
import { ErrorPanel, TopBar, errMsg } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/teacher/virtual-exams/$examId")({
  head: () => ({
    meta: [
      { title: "Exam submissions — Intuition" },
      { name: "description", content: "Every student attempt for this virtual exam, with reports." },
      { property: "og:title", content: "Exam submissions — Intuition" },
      { property: "og:description", content: "Review attempts, recordings and AI feedback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { examId } = Route.useParams();
  const fetch = useServerFn(getVirtualExamAttempts);
  const q = useQuery({ queryKey: ["virtual-exam-attempts", examId], queryFn: () => fetch({ data: { examId } }), refetchInterval: 20_000 });
  return (
    <div className="min-h-screen bg-background">
      <TopBar right={<Button asChild variant="outline" size="sm"><Link to="/teacher/virtual-exams"><ArrowLeft /> Virtual exams</Link></Button>} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 sm:px-6">
        {q.isLoading && <Skeleton className="h-60 rounded-lg" />}
        {q.isError && <ErrorPanel message={errMsg(q.error)} onRetry={() => q.refetch()} />}
        {q.data && (
          <>
            <header className="flex flex-wrap items-end gap-3">
              <div className="mr-auto"><h1 className="text-3xl">{q.data.exam.title}</h1>
                <p className="text-muted-foreground">{q.data.exam.questionCount} questions · {q.data.exam.durationMinutes} min · {q.data.exam.maxAttempts} attempt(s)</p></div>
              {q.data.exam.pdfUrl && <Button asChild variant="outline"><a href={q.data.exam.pdfUrl} target="_blank" rel="noreferrer"><FileText /> Open PDF</a></Button>}
            </header>
            {q.data.attempts.length === 0 && <p className="rounded-lg border-2 border-dashed border-border p-8 text-center text-muted-foreground">No student has started this exam yet.</p>}
            <ul className="space-y-3">
              {q.data.attempts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-card p-4 shadow-soft">
                  <div className="mr-auto"><p className="font-bold">{a.studentName} <span className="text-sm font-normal text-muted-foreground">· attempt {a.attemptNumber}</span></p>
                    <p className="text-sm text-muted-foreground">{a.status === "submitted" ? `Submitted ${a.submittedAt ? new Date(a.submittedAt).toLocaleString() : ""}${a.autoSubmitted ? " (time ran out)" : ""}` : `In progress since ${new Date(a.startedAt).toLocaleTimeString()}`}</p></div>
                  <span className="rounded-md border-2 border-border px-2 py-0.5 text-xs font-bold">{a.status === "submitted" ? `Report: ${a.reportStatus}` : "Live"}</span>
                  <Button asChild size="sm"><Link to="/teacher/virtual-report/$attemptId" params={{ attemptId: a.id }}><ExternalLink /> Open</Link></Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
