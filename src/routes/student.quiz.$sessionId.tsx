import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { finishSession } from "@/lib/nour/api.functions";
import { ThinkingDots } from "@/components/nour/Nour";
import { WaitingMusic, WritingJonathan } from "@/components/nour/WritingJonathan";
import { QuizCardView } from "@/components/nour/QuizCards";
import { ErrorPanel, TopBar, errMsg } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/student/quiz/$sessionId")({
  head: () => ({
    meta: [
      { title: "Jonathan's test — Intuition" },
      { name: "description", content: "Watch Jonathan answer new questions using what you taught it." },
      { property: "og:title", content: "Jonathan's test — Intuition" },
      { property: "og:description", content: "Jonathan takes the quiz. Your score is what Jonathan learned." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const finish = useServerFn(finishSession);
  const q = useQuery({ queryKey: ["result", sessionId], queryFn: () => finish({ data: { sessionId } }), staleTime: Infinity });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!q.data) return;
    if (shown >= q.data.quiz.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 2500 : 3500);
    return () => clearTimeout(t);
  }, [q.data, shown]);

  const total = q.data?.quiz.length ?? 0;
  const thinking = q.data && shown < total;

  return (
    <div className="min-h-screen bg-night text-midnight-foreground">
      <TopBar tone="light" />
      <WaitingMusic active={!!(thinking || q.isLoading)} />
      <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <WritingJonathan writing={!!(thinking || q.isLoading)} />
          <h1 className="mt-4 text-3xl font-extrabold">Jonathan's test</h1>
          <p className="mt-1 text-midnight-foreground/70">You've done the teaching. Sit back and relax while Jonathan writes his answers on his own.</p>
        </div>
        {q.isError && <ErrorPanel className="mt-6" message={errMsg(q.error)} onRetry={() => q.refetch()} />}
        <div className="mt-8 space-y-4">
          {q.data?.quiz.slice(0, shown).map((c, i) => <QuizCardView key={c.confusionId} card={c} index={i} />)}
          {(q.isLoading || thinking) && (
            <div className="flex items-center justify-center gap-3 rounded-3xl border border-dashed border-midnight-foreground/20 p-6 text-sm text-midnight-foreground/70">
              <ThinkingDots /> Jonathan is working on question {Math.min(shown + 1, total || 1)}…
            </div>
          )}
        </div>
        {q.data && !thinking && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="glow" size="lg" onClick={() => navigate({ to: "/student/result/$sessionId", params: { sessionId } })}>
              See the result <ArrowRight />
            </Button>
          </div>
        )}
        {q.data && thinking && (
          <div className="mt-4 text-center">
            <button className="text-sm text-midnight-foreground/60 underline underline-offset-4" onClick={() => setShown(total)}>Show all answers</button>
          </div>
        )}
      </main>
    </div>
  );
}
