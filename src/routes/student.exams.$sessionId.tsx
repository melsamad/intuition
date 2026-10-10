import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getStudentExam } from "@/lib/nour/api.functions";
import { SolutionView } from "@/components/nour/SolutionDocument";
import { QuizCardView } from "@/components/nour/QuizCards";
import { TopBar } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic } from "lucide-react";

const examQuery = (sessionId: string) => queryOptions({ queryKey: ["student-exam", sessionId], queryFn: () => getStudentExam({ data: { sessionId } }) });

export const Route = createFileRoute("/student/exams/$sessionId")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(examQuery(params.sessionId)),
  head: () => ({ meta: [
    { title: "Saved solution — Jonathan's past exams" },
    { name: "description", content: "Review your written solution and Jonathan's answers from a previous lesson." },
    { property: "og:title", content: "Saved solution — Jonathan's past exams" },
    { property: "og:description", content: "Your saved formulas, notes and Jonathan's test sheet." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: PastExam,
});

function PastExam() {
  const { sessionId } = Route.useParams();
  const { data } = useSuspenseQuery(examQuery(sessionId));
  return <div className="min-h-screen bg-night text-midnight-foreground">
    <TopBar tone="light" />
    <main className="space-y-6 px-4 pb-12 sm:px-6">
      <Button asChild variant="night"><Link to="/student"><ArrowLeft /> Jonathan's past exams</Link></Button>
      <h1 className="text-3xl">{data.title}</h1>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="min-w-0"><h2 className="mb-3 text-xl">My written solution</h2><SolutionView text={data.solution} /></section>
        <section className="space-y-4">
          {data.completed ? <><h2 className="text-xl">Jonathan's test sheet</h2>{data.quiz.map((card, i) => <QuizCardView key={`${card.confusionId}-${i}`} card={card} index={i} showExplanation />)}</> : <Button asChild variant="glow"><Link to="/student/session/$sessionId" params={{ sessionId }}><Mic /> Continue explaining</Link></Button>}
        </section>
      </div>
    </main>
  </div>;
}