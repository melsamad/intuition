import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Check, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { draftTopic, saveTopic, type ConfusionDraft } from "@/lib/nour/api.functions";
import { ConfusionEditor } from "@/components/nour/ConfusionEditor";
import { ErrorPanel, TopBar, errMsg } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/teacher/topics/new")({
  head: () => ({
    meta: [
      { title: "Draft a topic — Intuition" },
      { name: "description", content: "Let AI draft misconceptions for a new maths or science topic, then review before publishing." },
      { property: "og:title", content: "Draft a topic — Intuition" },
      { property: "og:description", content: "AI-drafted misconceptions with mandatory teacher review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TopicDraft,
});

function TopicDraft() {
  const draft = useServerFn(draftTopic);
  const save = useServerFn(saveTopic);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Maths");
  const [grade, setGrade] = useState(6);
  const [description, setDescription] = useState("");
  const [list, setList] = useState<ConfusionDraft[] | null>(null);
  const [busy, setBusy] = useState<"draft" | "save" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy("draft");
    setErr(null);
    try {
      const r = await draft({ data: { title, subject, gradeLevel: grade } });
      if (!r.ok) setErr(r.error);
      else setList(r.confusions);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  }
  async function approve() {
    if (!list || busy) return;
    setBusy("save");
    setErr(null);
    try {
      const saved = await save({ data: { title, subject, gradeLevel: grade, description, confusions: list } });
      toast.success("Topic approved and added to your library.");
      await qc.invalidateQueries({ queryKey: ["topics"] });
      navigate({ to: "/teacher/assignments/new", search: { topicId: saved.id } });
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-night text-midnight-foreground">
        <TopBar tone="light" />
        <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <Link to="/teacher" search={{}} className="inline-flex items-center gap-1 text-sm text-midnight-foreground/70 hover:text-midnight-foreground"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
          <h1 className="mt-3 text-3xl font-extrabold">Draft a new topic</h1>
          <p className="mt-1 text-sm text-midnight-foreground/70">Maths and science only for now. Nothing is published until you approve it.</p>
        </div>
      </div>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <section className="grid gap-4 rounded-3xl bg-card p-6 shadow-soft sm:grid-cols-3">
          <label className="sm:col-span-3">
            <span className="text-sm font-semibold">Topic title</span>
            <Input className="mt-1" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Multiplying decimals" />
          </label>
          <label>
            <span className="text-sm font-semibold">Subject</span>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Maths">Maths</SelectItem><SelectItem value="Science">Science</SelectItem></SelectContent>
            </Select>
          </label>
          <label>
            <span className="text-sm font-semibold">Grade</span>
            <Input className="mt-1" type="number" min={1} max={12} value={grade} onChange={(e) => setGrade(Number(e.target.value))} />
          </label>
          <div className="flex items-end">
            <Button className="w-full" onClick={run} disabled={!!busy || title.trim().length < 3}>
              {busy === "draft" ? <Loader2 className="animate-spin" /> : <Wand2 />} {list ? "Redraft" : "Draft with AI"}
            </Button>
          </div>
        </section>
        {err && <ErrorPanel message={err} />}
        {list && (
          <>
            <p className="rounded-2xl bg-pending-soft p-3 text-sm font-bold text-pending-foreground">AI draft — teacher review required. Check every answer for accuracy before approving.</p>
            <label className="block">
              <span className="text-sm font-semibold">Short description</span>
              <Textarea className="mt-1" maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <ConfusionEditor list={list} onChange={setList} />
            <div className="flex justify-end">
              <Button size="lg" onClick={approve} disabled={!!busy}>
                {busy === "save" ? <Loader2 className="animate-spin" /> : <Check />} I've reviewed it, approve and save
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
