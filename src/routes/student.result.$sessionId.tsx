import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Copy, Home, House, Loader2, MessageCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { finishSession, startSession } from "@/lib/nour/api.functions";
import { Nour } from "@/components/nour/Nour";
import { QuizCardView } from "@/components/nour/QuizCards";
import { ErrorPanel, TopBar, errMsg } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/student/result/$sessionId")({
  head: () => ({
    meta: [
      { title: "Jonathan's result — Intuition" },
      { name: "description", content: "See how Jonathan scored thanks to your teaching." },
      { property: "og:title", content: "Jonathan's result — Intuition" },
      { property: "og:description", content: "Jonathan's score, and the exact words that helped it learn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const finish = useServerFn(finishSession);
  const start = useServerFn(startSession);
  const q = useQuery({ queryKey: ["result", sessionId], queryFn: () => finish({ data: { sessionId } }) });
  const [again, setAgain] = useState(false);
  const lock = useRef(false);

  async function teachAgain() {
    if (!q.data || lock.current) return;
    lock.current = true;
    setAgain(true);
    try {
      const name = localStorage.getItem("intuition-alias") || "Demo Student";
      const r = await start({ data: { assignmentId: q.data.assignmentId, studentName: name } });
      navigate({ to: "/student/session/$sessionId", params: { sessionId: r.sessionId } });
    } catch (e) {
      toast.error(errMsg(e));
      lock.current = false;
      setAgain(false);
    }
  }

  const d = q.data;
  return (
    <div className="min-h-screen bg-night text-midnight-foreground">
      <TopBar tone="light" />
      <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        {q.isLoading && <Skeleton className="h-64 rounded-3xl bg-midnight-soft" />}
        {q.isError && <ErrorPanel message={errMsg(q.error)} onRetry={() => q.refetch()} />}
        {d && (
          <>
            <section className="flex flex-col items-center text-center">
              <Nour mood={d.raw === d.total ? "excited" : d.raw > 0 ? "curious" : "confused"} size={120} />
              <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">
                Jonathan scored <span className="text-glow">{d.raw}/{d.total}</span>, thanks to you.
              </h1>
              {d.mode === "graded" ? (
                <p className="mt-3 text-midnight-foreground/75">
                  Graded score after hints: <strong>{d.adjusted}/{d.total}</strong> ({d.hinted} idea{d.hinted === 1 ? "" : "s"} used a hint).
                </p>
              ) : (
                <p className="mt-3 text-midnight-foreground/75">Practice mode: hints don't affect the score.</p>
              )}
              <p className="mt-2 text-sm text-midnight-foreground/60">
                {d.raw === d.total
                  ? "Jonathan understood every idea you taught."
                  : d.raw === 0
                    ? "Jonathan still holds his old beliefs. Below is what each one really means."
                    : `Jonathan understood ${d.raw} idea${d.raw === 1 ? "" : "s"}. The rest are worth practising.`}
              </p>
              {d.homeTaughtAt && (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-glow/20 px-4 py-1.5 text-sm font-bold"><House className="h-4 w-4" /> Taught at home</span>
              )}
            </section>
            {d.dinnerQuestion && (
              <section className="mt-8 overflow-hidden rounded-3xl bg-pending-soft p-6 text-center text-pending-foreground shadow-glow sm:p-8">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pending px-3 py-1 text-xs font-bold uppercase tracking-wider text-midnight">Next step · Tonight</span>
                <House className="mx-auto mt-4 h-10 w-10" />
                <h2 className="mt-2 text-3xl font-extrabold">Now teach it at home!</h2>
                <p className="mx-auto mt-2 max-w-md">Send your parents tonight's dinner question. They ask you, you explain, they tap one button, and you earn a <strong>"Taught at home"</strong> badge.</p>
                <p className="mx-auto mt-4 max-w-md rounded-2xl bg-card p-4 text-lg font-bold text-card-foreground">"{d.dinnerQuestion}"</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button asChild size="lg" className="bg-fixed text-midnight hover:bg-fixed/90">
                    <a href={whatsappLink(d)} target="_blank" rel="noopener noreferrer"><MessageCircle /> Send to my parents on WhatsApp</a>
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/home/${d.sessionId}`).then(() => toast.success("Parent link copied.")); }}>
                    <Copy /> Copy link
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/home/$sessionId" params={{ sessionId: d.sessionId }} target="_blank">See what parents see</Link>
                  </Button>
                </div>
              </section>
            )}
            <div className="mt-8 space-y-4">
              {d.quiz.map((c, i) => <QuizCardView key={c.confusionId} card={c} index={i} showExplanation />)}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="night"><Link to="/student/exams/$sessionId" params={{ sessionId }}>View my written solution</Link></Button>
              {d.mode === "practice" ? (
                <Button variant="glow" size="lg" onClick={teachAgain} disabled={again}>
                  {again ? <Loader2 className="animate-spin" /> : <RotateCcw />} Teach Jonathan again
                </Button>
              ) : (
                <p className="w-full text-center text-sm text-midnight-foreground/60">Graded assignments allow one attempt.</p>
              )}
              <Button asChild variant="night" size="lg">
                <Link to="/student"><Home /> Home</Link>
              </Button>
            </div>
            <p className="mt-6 text-center text-xs text-midnight-foreground/50">Your teacher's class map has been updated.</p>
          </>
        )}
      </main>
    </div>
  );
}

function whatsappLink(d: { studentName: string; fixedIdeas: number; topic: string; dinnerQuestion: string; sessionId: string }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const url = `${origin}/home/${d.sessionId}`;
  const ideas = `${d.fixedIdeas} idea${d.fixedIdeas === 1 ? "" : "s"}`;
  const msg = `Tonight ${d.studentName} taught Jonathan ${ideas} about ${d.topic.toLowerCase()}. Ask them at dinner: ${d.dinnerQuestion} Let them explain it to you! ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}
