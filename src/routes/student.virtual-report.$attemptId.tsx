import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/nour/Shell";
import { VirtualExamReport } from "@/components/nour/VirtualExamReport";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/student/virtual-report/$attemptId")({
  head: () => ({
    meta: [
      { title: "My exam feedback — Intuition" },
      { name: "description", content: "Your personalised report: time per question, strengths, unclear reasoning and next steps." },
      { property: "og:title", content: "My exam feedback — Intuition" },
      { property: "og:description", content: "Evidence-based feedback on your virtual exam." },
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
      <TopBar right={<Button asChild variant="outline" size="sm"><Link to="/student"><ArrowLeft /> Dashboard</Link></Button>} />
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6"><VirtualExamReport attemptId={attemptId} viewer="student" /></main>
    </div>
  );
}
