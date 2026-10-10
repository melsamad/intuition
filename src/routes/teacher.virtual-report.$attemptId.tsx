import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/nour/Shell";
import { VirtualExamReport } from "@/components/nour/VirtualExamReport";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/teacher/virtual-report/$attemptId")({
  head: () => ({
    meta: [
      { title: "Student exam report — Intuition" },
      { name: "description", content: "Review a student's virtual exam: notes, recordings, transcripts and AI feedback." },
      { property: "og:title", content: "Student exam report — Intuition" },
      { property: "og:description", content: "Evidence-based feedback on a virtual exam attempt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { attemptId } = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <TopBar right={<Button asChild variant="outline" size="sm"><Link to="/teacher/virtual-exams"><ArrowLeft /> Virtual exams</Link></Button>} />
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6"><VirtualExamReport attemptId={attemptId} viewer="teacher" /></main>
    </div>
  );
}
