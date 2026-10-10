import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock, FileText, Loader2, Mic, RefreshCw, Send, Square, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  createRecordingUpload, deleteRecording, getExamAttempt, moveRecording, retryTranscript, saveExamNotes, saveExamRecording, submitExamAttempt,
} from "@/lib/nour/virtual-exam.functions";
import { hasMathKeyboard } from "@/lib/nour/solution";
import { SolutionDocument } from "@/components/nour/SolutionDocument";
import { ErrorPanel, errMsg } from "@/components/nour/Shell";
import { fmtDuration } from "@/components/nour/VirtualExamReport";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/virtual-exam/$attemptId")({
  head: () => ({
    meta: [
      { title: "Virtual exam in progress — Intuition" },
      { name: "description", content: "A distraction-free exam workspace with your PDF, journal, timer and voice explanations." },
      { property: "og:title", content: "Virtual exam — Intuition" },
      { property: "og:description", content: "Timed exam workspace with autosaving notes and spoken explanations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Workspace,
});

type Data = Awaited<ReturnType<typeof getExamAttempt>>;

function Workspace() {
  const { attemptId } = Route.useParams();
  const fetchAttempt = useServerFn(getExamAttempt);
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["virtual-attempt", attemptId], queryFn: () => fetchAttempt({ data: { attemptId } }), refetchOnWindowFocus: false });
  const submitted = q.data?.attempt.status === "submitted";
  useEffect(() => {
    if (submitted) navigate({ to: "/student/virtual-report/$attemptId", params: { attemptId }, replace: true });
  }, [submitted, attemptId, navigate]);
  if (q.isLoading) return <div className="p-6"><Skeleton className="h-[80dvh] rounded-lg" /></div>;
  if (q.isError || !q.data) return <div className="mx-auto max-w-xl p-6"><ErrorPanel message={errMsg(q.error)} onRetry={() => q.refetch()} /></div>;
  if (submitted) return <div className="grid h-dvh place-items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  return <ExamRoom data={q.data} refetch={() => q.refetch()} />;
}

function ExamRoom({ data, refetch }: { data: Data; refetch: () => void }) {
  const { exam, attempt } = data;
  const navigate = useNavigate();
  const save = useServerFn(saveExamNotes);
  const submit = useServerFn(submitExamAttempt);
  const [question, setQuestion] = useState(1);
  const [notes, setNotes] = useState<Record<string, string>>(() => attempt.notes ?? {});
  const [saveState, setSaveState] = useState<string>(attempt.notesSavedAt ? "All changes saved" : "");
  const [submitting, setSubmitting] = useState(false);
  const notesRef = useRef(notes);
  const dirty = useRef(false);
  const submittedRef = useRef(false);
  const offset = useRef(Date.parse(data.serverNow) - Date.now());
  const deadline = Date.parse(attempt.deadlineAt);
  const [remaining, setRemaining] = useState(() => deadline - (Date.now() + offset.current));

  const doSubmit = useCallback(async (auto: boolean) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await submit({ data: { attemptId: attempt.id, notes: notesRef.current } });
      if (auto) toast.info("Time's up — your exam was submitted automatically.");
      navigate({ to: "/student/virtual-report/$attemptId", params: { attemptId: attempt.id }, replace: true });
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      toast.error(`${errMsg(e)} Retrying…`);
      if (auto) setTimeout(() => doSubmit(true), 3000);
    }
  }, [attempt.id, navigate, submit]);

  // countdown + auto-submit
  useEffect(() => {
    const t = setInterval(() => {
      const left = deadline - (Date.now() + offset.current);
      setRemaining(left);
      if (left <= 0) doSubmit(true);
    }, 500);
    return () => clearInterval(t);
  }, [deadline, doSubmit]);

  // autosave (debounced)
  const flush = useCallback(async () => {
    if (!dirty.current || submittedRef.current) return;
    dirty.current = false;
    setSaveState("Saving…");
    try {
      await save({ data: { attemptId: attempt.id, notes: notesRef.current } });
      setSaveState(`Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`);
    } catch (e) {
      dirty.current = true;
      setSaveState("Not saved — retrying");
      const m = errMsg(e);
      if (/submitted/i.test(m)) refetch();
    }
  }, [attempt.id, save, refetch]);
  useEffect(() => {
    const t = setInterval(flush, 2000);
    const before = (e: BeforeUnloadEvent) => { if (dirty.current) { flush(); e.preventDefault(); } };
    window.addEventListener("beforeunload", before);
    return () => { clearInterval(t); window.removeEventListener("beforeunload", before); };
  }, [flush]);

  function setNote(v: string) {
    const next = { ...notesRef.current, [String(question)]: v };
    notesRef.current = next;
    dirty.current = true;
    setNotes(next);
    setSaveState("Unsaved changes");
  }

  const secs = Math.max(0, Math.ceil(remaining / 1000));
  const low = secs <= 60, warn = secs <= 300;
  const recsFor = (n: number) => data.recordings.filter((r) => r.questionNumber === n);

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b-[2.5px] border-border bg-card px-4 py-2">
        <div className="mr-auto min-w-0">
          <p className="truncate text-xs font-bold uppercase text-muted-foreground">My Virtual Exam · attempt {attempt.attemptNumber}/{exam.maxAttempts}</p>
          <h1 className="truncate text-lg font-extrabold">{exam.title}</h1>
        </div>
        <span role="status" className="text-xs text-muted-foreground">{saveState}</span>
        <div role="timer" aria-live={low ? "assertive" : "off"} aria-label="Time remaining"
          className={cn("flex items-center gap-2 rounded-md border-[2.5px] border-border px-3 py-1 font-mono text-xl font-extrabold tabular-nums shadow-brutal", low ? "animate-pulse bg-wrong text-ink" : warn ? "bg-pending text-ink" : "bg-card")}>
          <Clock className="h-5 w-5" />{String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="glow" disabled={submitting}>{submitting ? <Loader2 className="animate-spin" /> : <Send />} Submit</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Submit your exam?</AlertDialogTitle>
              <AlertDialogDescription>You can't change your answers afterwards. {exam.maxAttempts - attempt.attemptNumber > 0 ? `You have ${exam.maxAttempts - attempt.attemptNumber} attempt(s) left after this.` : "This is your last attempt."}</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Keep working</AlertDialogCancel><AlertDialogAction onClick={() => doSubmit(false)}>Submit now</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <section className="flex min-h-[50dvh] flex-col border-b-[2.5px] border-border lg:border-b-0 lg:border-r-[2.5px]">
          {exam.pdfUrl ? (
            <>
              <iframe title="Exam paper" src={`${exam.pdfUrl}#toolbar=0&navpanes=0`} className="min-h-0 w-full flex-1 bg-muted" />
              <a href={exam.pdfUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 border-t-2 border-border p-2 text-sm font-semibold underline lg:hidden"><FileText className="h-4 w-4" /> Open the exam paper in a new tab</a>
            </>
          ) : <ErrorPanel className="m-4" message="The exam paper couldn't be loaded." onRetry={refetch} />}
        </section>

        <section className="min-h-0 overflow-y-auto p-4 sm:p-6">
          <nav aria-label="Questions" className="mb-4 flex flex-wrap gap-2">
            {Array.from({ length: exam.questionCount }, (_, i) => i + 1).map((n) => {
              const has = !!notes[String(n)]?.trim() || recsFor(n).length > 0;
              return <button key={n} type="button" onClick={() => setQuestion(n)} aria-current={n === question}
                className={cn("h-10 min-w-10 rounded-md border-[2.5px] border-border px-2 font-bold transition", n === question ? "bg-primary text-primary-foreground shadow-brutal" : has ? "bg-fixed text-ink" : "bg-card hover:bg-muted")}>Q{n}</button>;
            })}
          </nav>

          <SolutionDocument value={notes[String(question)] ?? ""} onChange={setNote} math={hasMathKeyboard(exam.subject)} disabled={submitting} saveStatus="" onSave={flush} />

          <QuestionRecorder key={question} attemptId={attempt.id} question={question} questionCount={exam.questionCount} recordings={recsFor(question)} onChanged={refetch} disabled={submitting} />
          <p className="mt-6 text-xs text-muted-foreground">No AI help is available during the exam. Your notes save automatically; recordings are transcribed for your feedback report after you submit.</p>
        </section>
      </div>
    </div>
  );
}

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) if (MediaRecorder.isTypeSupported?.(m)) return m;
  return null;
}
const MAX_MS = 5 * 60_000;

function QuestionRecorder({ attemptId, question, questionCount, recordings, onChanged, disabled }: {
  attemptId: string; question: number; questionCount: number; recordings: Data["recordings"]; onChanged: () => void; disabled: boolean;
}) {
  const prepare = useServerFn(createRecordingUpload);
  const saveRec = useServerFn(saveExamRecording);
  const retry = useServerFn(retryTranscript);
  const move = useServerFn(moveRecording);
  const del = useServerFn(deleteRecording);
  const [rec, setRec] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState<{ blob: Blob; ms: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const mr = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAll = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setRec(false);
  }, []);
  useEffect(() => () => { try { mr.current?.stop(); } catch { /* noop */ } stopAll(); }, [stopAll]);

  async function upload(blob: Blob, ms: number) {
    setUploading(true);
    setNote(null);
    try {
      const up = await prepare({ data: { attemptId, mime: blob.type, size: blob.size } });
      const { error } = await supabase.storage.from("virtual-exams").uploadToSignedUrl(up.path, up.token, blob, { contentType: blob.type.split(";")[0] ?? "audio/webm" });
      if (error) throw new Error("Upload failed. Check your connection.");
      const r = await saveRec({ data: { attemptId, questionNumber: question, path: up.path, mime: blob.type, durationMs: ms } });
      setPending(null);
      if (r.transcriptStatus === "failed") setNote("Saved. The transcript couldn't be made yet — you can retry it below.");
      onChanged();
    } catch (e) {
      setPending({ blob, ms });
      setNote(`${errMsg(e)} Your recording is kept — tap Retry upload.`);
    } finally {
      setUploading(false);
    }
  }

  async function start() {
    if (rec || disabled) return;
    const mime = pickMime();
    if (!mime || !navigator.mediaDevices?.getUserMedia) return setNote("Voice recording isn't supported in this browser. You can still write your answer.");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const r = new MediaRecorder(s, { mimeType: mime, audioBitsPerSecond: 32000 });
      chunks.current = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        const ms = Date.now() - started.current;
        stopAll();
        const blob = new Blob(chunks.current, { type: (r.mimeType || mime).split(";")[0] ?? "audio/webm" });
        chunks.current = [];
        if (blob.size < 1000) return setNote("That recording was empty. Try again.");
        upload(blob, ms);
      };
      mr.current = r;
      started.current = Date.now();
      r.start(1000);
      setRec(true);
      setElapsed(0);
      setNote(null);
      timer.current = setInterval(() => {
        const ms = Date.now() - started.current;
        setElapsed(ms);
        if (ms >= MAX_MS && r.state === "recording") r.stop();
      }, 250);
    } catch (e) {
      stopAll();
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setNote(denied ? "Microphone access is blocked. Allow it in your browser's address bar, or keep writing your answer." : "No microphone was found. You can still write your answer.");
    }
  }
  const stop = () => { if (mr.current?.state === "recording") mr.current.stop(); };

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusyId(id);
    try { await fn(); onChanged(); } catch (e) { toast.error(errMsg(e)); } finally { setBusyId(null); }
  }

  return (
    <section className="mt-6 rounded-lg bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-lg font-bold">Spoken explanation · Q{question}</h2>
        {!rec ? (
          <Button onClick={start} disabled={disabled || uploading}>{uploading ? <><Loader2 className="animate-spin" /> Saving…</> : <><Mic /> Record explanation</>}</Button>
        ) : (
          <Button variant="destructive" onClick={stop}><Square /> Stop · {fmtDuration(elapsed)}</Button>
        )}
      </div>
      {rec && <div className="mt-3 h-2 overflow-hidden rounded border-2 border-border"><div className="h-full bg-wrong" style={{ width: `${Math.min(100, (elapsed / MAX_MS) * 100)}%` }} /></div>}
      {note && <p role="alert" className="mt-3 flex items-start gap-2 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{note}</p>}
      {pending && !uploading && <Button size="sm" variant="outline" className="mt-2" onClick={() => upload(pending.blob, pending.ms)}><UploadCloud /> Retry upload</Button>}
      <ul className="mt-4 space-y-3">
        {recordings.length === 0 && <li className="text-sm text-muted-foreground">No recordings for this question yet.</li>}
        {recordings.map((r, i) => (
          <li key={r.id} className="rounded-md border-2 border-border p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="mr-auto font-bold">Recording {i + 1} · {fmtDuration(r.durationMs)}</span>
              <label className="text-xs">Question
                <select className="ml-1 rounded border-2 border-border bg-background px-1 py-0.5" value={r.questionNumber} disabled={busyId === r.id}
                  onChange={(e) => act(r.id, () => move({ data: { recordingId: r.id, questionNumber: Number(e.target.value) } }))}>
                  {Array.from({ length: questionCount }, (_, k) => k + 1).map((n) => <option key={n} value={n}>Q{n}</option>)}
                </select>
              </label>
              <Button size="icon" variant="outline" aria-label="Delete recording" disabled={busyId === r.id} onClick={() => act(r.id, () => del({ data: { recordingId: r.id } }))}><Trash2 /></Button>
            </div>
            {r.url && <audio controls preload="none" src={r.url} className="mt-2 w-full" />}
            <p className="mt-2 text-sm text-muted-foreground">
              {r.transcriptStatus === "done" ? (r.transcript || "(no speech detected)") : r.transcriptStatus === "failed" ? "Transcript not available yet." : "Transcribing…"}
            </p>
            {r.transcriptStatus === "failed" && <Button size="sm" variant="outline" className="mt-2" disabled={busyId === r.id} onClick={() => act(r.id, () => retry({ data: { recordingId: r.id } }))}><RefreshCw /> Retry transcript</Button>}
          </li>
        ))}
      </ul>
      <Link to="/student" className="sr-only">Back to dashboard</Link>
    </section>
  );
}
