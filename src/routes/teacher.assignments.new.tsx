import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Save, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { createAssignment, listTopics, type ConfusionDraft } from "@/lib/nour/api.functions";
import { ConfusionEditor } from "@/components/nour/ConfusionEditor";
import { TestBuilder } from "@/components/nour/TestBuilder";
import type { TestQuestion } from "@/lib/nour/rules";
import { ErrorPanel, TopBar, errMsg } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/teacher/assignments/new")({
  validateSearch: (s: Record<string, unknown>): { topicId?: string } =>
    typeof s["topicId"] === "string" ? { topicId: s["topicId"] } : {},
  head: () => ({
    meta: [
      { title: "New assignment — Intuition" },
      { name: "description", content: "Create a Teach Jonathan assignment: choose a topic, misconceptions, mode and time cap." },
      { property: "og:title", content: "New assignment — Intuition" },
      { property: "og:description", content: "Build a learning-by-teaching assignment in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Builder,
});

function Builder() {
  const { topicId: requestedTopicId } = Route.useSearch();
  const fetchTopics = useServerFn(listTopics);
  const create = useServerFn(createAssignment);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["topics"], queryFn: () => fetchTopics() });
  const [topicId, setTopicId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState(5);
  const [mode, setMode] = useState<"practice" | "graded">("practice");
  const [timeLimit, setTimeLimit] = useState(10);
  const [due, setDue] = useState("");
  const [active, setActive] = useState(true);
  const [list, setList] = useState<ConfusionDraft[]>([]);
  const [baseCount, setBaseCount] = useState(0);
  const [test, setTest] = useState<TestQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const suggestedTitle = useRef("");

  function pick(id: string) {
    const t = q.data?.find((x) => x.id === id);
    if (!t) return;
    setTopicId(id);
    const previousSuggestion = suggestedTitle.current;
    setTitle((previous) => !previous || previous === previousSuggestion ? t.title : previous);
    suggestedTitle.current = t.title;
    setGrade(t.grade_level);
    const l = t.confusions.map((c) => ({ ...c, originalId: c.id }));
    setList(l);
    setBaseCount(l.length);
    setTest(l.map((c) => ({ code: c.code, question: c.quiz_question, correct_answer: c.answer_if_fixed, trap_answer: c.answer_if_not })));
  }
  useEffect(() => {
    if (topicId || !q.data?.length) return;
    const initial = requestedTopicId ? q.data.find((t) => t.id === requestedTopicId) : q.data[0];
    if (initial) pick(initial.id);
  }, [q.data, topicId, requestedTopicId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setErr(null);
    setSaving(true);
    try {
      const r = await create({
        data: { title, topicId, gradeLevel: grade, mode, timeLimit, dueAt: due ? new Date(due).toISOString() : null, isActive: active, confusions: list, testQuestions: test.filter((t) => list.some((c) => c.code === t.code)) },
      });
      toast.success("Assignment saved. Students can see it now.");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["student-home"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      navigate({ to: "/teacher", search: { a: r.id } });
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-night text-midnight-foreground">
        <TopBar tone="light" />
        <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <Link to="/teacher" search={{}} className="inline-flex items-center gap-1 text-sm text-midnight-foreground/70 hover:text-midnight-foreground"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
          <h1 className="mt-3 text-3xl font-extrabold">New assignment</h1>
        </div>
      </div>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {q.isLoading && <Skeleton className="h-96 rounded-3xl" />}
        {q.isError && <ErrorPanel message={errMsg(q.error)} onRetry={() => q.refetch()} />}
        {q.data && (
          <form onSubmit={submit} className="space-y-6">
            <section className="grid gap-4 rounded-3xl bg-card p-6 shadow-soft sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-semibold">Topic</span>
                <Select value={topicId} onValueChange={pick}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a topic" /></SelectTrigger>
                  <SelectContent>
                    {q.data.map((t) => <SelectItem key={t.id} value={t.id}>{t.title} · {t.subject}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-semibold">Title</span>
                <Input className="mt-1" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label>
                <span className="text-sm font-semibold">Grade level</span>
                <Input className="mt-1" type="number" min={1} max={12} required value={grade} onChange={(e) => setGrade(Number(e.target.value))} />
              </label>
              <label>
                <span className="text-sm font-semibold">Mode</span>
                <Select value={mode} onValueChange={(v) => setMode(v as "practice" | "graded")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">Practice · unlimited tries, hints free</SelectItem>
                    <SelectItem value="graded">Graded · one attempt, hints cost a point</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label>
                <span className="text-sm font-semibold">Session time cap (minutes)</span>
                <Input className="mt-1" type="number" min={1} max={60} required value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
              </label>
              <label>
                <span className="text-sm font-semibold">Due (your local time, optional)</span>
                <Input className="mt-1" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
              </label>
              <label className="flex items-center gap-3 sm:col-span-2">
                <Switch checked={active} onCheckedChange={setActive} />
                <span className="text-sm font-semibold">Active (visible to students)</span>
              </label>
            </section>

            <section>
              <h2 className="text-xl font-bold">Misconceptions ({list.length})</h2>
              <p className="text-sm text-muted-foreground">These are copied into this assignment only. Editing them won't change the topic library or past sessions.</p>
              {list.length !== baseCount && (
                <p className="mt-2 flex items-center gap-2 rounded-2xl bg-pending-soft p-3 text-sm text-pending-foreground">
                  <TriangleAlert className="h-4 w-4" /> Jonathan's test will now have {list.length} question{list.length === 1 ? "" : "s"}, so scores will be out of {list.length}.
                </p>
              )}
              <div className="mt-4"><ConfusionEditor list={list} onChange={setList} /></div>
            </section>

            <section>
              <h2 className="text-xl font-bold">Jonathan's test ({test.length} question{test.length === 1 ? "" : "s"})</h2>
              <p className="text-sm text-muted-foreground">After the student teaches, Jonathan takes this test. He answers correctly only on ideas the student actually fixed, and gives the trap answer otherwise. The score is out of {test.length || list.length}.</p>
              <div className="mt-4"><TestBuilder list={test} onChange={setTest} confusions={list} /></div>
            </section>

            {err && <ErrorPanel message={err} />}
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={saving || !topicId}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />} Save assignment
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
