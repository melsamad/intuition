import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, FileUp, Loader2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createExamUpload, createVirtualExam, deleteVirtualExam, listVirtualExams, setVirtualExamActive } from "@/lib/nour/virtual-exam.functions";
import { MAX_PDF_BYTES } from "@/lib/nour/virtual-exam-rules";
import { ErrorPanel, TopBar, errMsg } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/teacher/virtual-exams/")({
  head: () => ({
    meta: [
      { title: "Virtual exams — Intuition" },
      { name: "description", content: "Upload a PDF exam, set the time limit and attempts, and review students' reports." },
      { property: "og:title", content: "Virtual exams — Intuition" },
      { property: "og:description", content: "Timed PDF exams with spoken explanations and evidence-based feedback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const list = useServerFn(listVirtualExams);
  const q = useQuery({ queryKey: ["virtual-exams"], queryFn: () => list() });
  const setActive = useServerFn(setVirtualExamActive);
  const del = useServerFn(deleteVirtualExam);
  const qc = useQueryClient();
  return (
    <div className="min-h-screen bg-background">
      <TopBar right={<Button asChild variant="outline" size="sm"><Link to="/teacher"><ArrowLeft /> Dashboard</Link></Button>} />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section>
          <h1 className="text-3xl">My Virtual Exams</h1>
          <p className="mt-1 text-muted-foreground">Upload a PDF, choose the time limit and attempts. Students get no AI help during the exam.</p>
          <CreateForm onCreated={() => qc.invalidateQueries({ queryKey: ["virtual-exams"] })} />
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl">Assigned exams</h2>
          {q.isLoading && <Skeleton className="h-40 rounded-lg" />}
          {q.isError && <ErrorPanel message={errMsg(q.error)} onRetry={() => q.refetch()} />}
          {q.data?.length === 0 && <p className="rounded-lg border-2 border-dashed border-border p-8 text-center text-muted-foreground">No virtual exams yet.</p>}
          {q.data?.map((e) => (
            <article key={e.id} className="rounded-lg bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-start gap-3">
                <div className="mr-auto min-w-0">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{e.subject || "Exam"} · {e.pdfFilename}</p>
                  <h3 className="text-xl font-bold">{e.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{e.questionCount} questions · {e.durationMinutes} min · {e.maxAttempts} attempt{e.maxAttempts > 1 ? "s" : ""}{e.dueAt ? ` · due ${new Date(e.dueAt).toLocaleString()}` : ""}</p>
                  <p className="mt-1 text-sm font-semibold">{e.submitted} submitted · {e.attempts} started {e.isActive ? "" : "· hidden from students"}</p>
                </div>
                <Button asChild size="sm"><Link to="/teacher/virtual-exams/$examId" params={{ examId: e.id }}><Users /> Submissions</Link></Button>
                <Button size="sm" variant="outline" onClick={async () => { try { await setActive({ data: { examId: e.id, active: !e.isActive } }); q.refetch(); } catch (err) { toast.error(errMsg(err)); } }}>{e.isActive ? "Hide" : "Show"}</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="icon" variant="outline" aria-label="Delete exam"><Trash2 /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete “{e.title}”?</AlertDialogTitle><AlertDialogDescription>This removes the PDF and every student attempt, recording and report.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={async () => { try { await del({ data: { examId: e.id } }); toast.success("Exam deleted"); q.refetch(); } catch (err) { toast.error(errMsg(err)); } }}>Delete</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const prepare = useServerFn(createExamUpload);
  const create = useServerFn(createVirtualExam);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Math");
  const [instructions, setInstructions] = useState("");
  const [questions, setQuestions] = useState(5);
  const [minutes, setMinutes] = useState(30);
  const [attempts, setAttempts] = useState(1);
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pick(f: File | null) {
    setError(null);
    if (!f) return setFile(null);
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) return setError("Please choose a PDF file.");
    if (f.size > MAX_PDF_BYTES) return setError("The PDF must be smaller than 20 MB.");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!file) return setError("Choose the exam PDF.");
    setError(null);
    try {
      setBusy("Uploading PDF…");
      const up = await prepare({ data: { filename: file.name, size: file.size, type: file.type || "application/pdf" } });
      const { error: upErr } = await supabase.storage.from("virtual-exams").uploadToSignedUrl(up.path, up.token, file, { contentType: "application/pdf" });
      if (upErr) throw new Error("The PDF upload failed. Check your connection and try again.");
      setBusy("Saving exam…");
      await create({ data: { title, subject, instructions, pdfPath: up.path, pdfFilename: file.name, questionCount: questions, durationMinutes: minutes, maxAttempts: attempts, dueAt: dueAt ? new Date(dueAt).toISOString() : null } });
      toast.success("Exam assigned to students");
      setFile(null); setTitle(""); setInstructions(""); setDueAt("");
      onCreated();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg bg-card p-6 shadow-soft">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-background p-6 text-center hover:bg-muted"
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0] ?? null); }}>
        <FileUp className="h-8 w-8" />
        <span className="font-bold">{file ? file.name : "Choose or drop the exam PDF"}</span>
        <span className="text-xs text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "PDF only, up to 20 MB"}</span>
        <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label htmlFor="ve-title">Title</Label><Input id="ve-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required /></div>
        <div><Label htmlFor="ve-subject">Subject</Label><Input id="ve-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={60} /></div>
        <div><Label htmlFor="ve-q">Number of questions</Label><Input id="ve-q" type="number" min={1} max={50} value={questions} onChange={(e) => setQuestions(Number(e.target.value))} /></div>
        <div><Label htmlFor="ve-min">Time limit (minutes)</Label><Input id="ve-min" type="number" min={1} max={300} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /></div>
        <div><Label htmlFor="ve-att">Attempts allowed</Label><Input id="ve-att" type="number" min={1} max={10} value={attempts} onChange={(e) => setAttempts(Number(e.target.value))} /></div>
        <div className="sm:col-span-2"><Label htmlFor="ve-due">Submission deadline (optional)</Label><Input id="ve-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label htmlFor="ve-ins">Notes for the feedback report (optional)</Label><Textarea id="ve-ins" value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={2000} placeholder="e.g. Q3 tests the chain rule; students must show working." /></div>
      </div>
      {error && <ErrorPanel message={error} />}
      <Button type="submit" variant="glow" className="w-full" disabled={!!busy}>{busy ? <><Loader2 className="animate-spin" /> {busy}</> : "Assign exam"}</Button>
    </form>
  );
}
