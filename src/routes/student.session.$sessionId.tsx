import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Eraser, Flag, Lightbulb, Loader2, Mic, Square, Trash2, Volume2, VolumeX, PenLine } from "lucide-react";
import { toast } from "sonner";
import { getSessionState, nourTurn, requestHint, speakAsJonathan, saveWrittenSolution } from "@/lib/nour/api.functions";
import type { Mood } from "@/lib/nour/rules";
import { Nour, ThinkingDots } from "@/components/nour/Nour";
import { UnderstandingMeter } from "@/components/nour/Status";
import { ErrorPanel, TopBar, errMsg } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SolutionDocument } from "@/components/nour/SolutionDocument";
import { MIN_EXPLANATION_MS, canFinishExplanation, hasMathKeyboard } from "@/lib/nour/solution";

export const Route = createFileRoute("/student/session/$sessionId")({
  head: () => ({
    meta: [
      { title: "Teaching Jonathan — Intuition" },
      { name: "description", content: "Explain the idea out loud to Jonathan while you draw and write in your journal." },
      { property: "og:title", content: "Teaching Jonathan — Intuition" },
      { property: "og:description", content: "A spoken, journal-style learning-by-teaching session with Jonathan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SessionPage,
});

const MIN_REC_MS = MIN_EXPLANATION_MS;
const MAX_REC_MS = 120_000;

let currentAudio: HTMLAudioElement | null = null;
const voiceCache = new Map<string, string>();
let speakSeq = 0;

function fallbackSpeak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

function stopVoice() {
  speakSeq++;
  currentAudio?.pause();
  currentAudio = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Jonathan speaks with his ElevenLabs voice; falls back to the browser voice if it's unavailable. */
async function speak(text: string) {
  if (typeof window === "undefined") return;
  stopVoice();
  const seq = speakSeq;
  try {
    let url = voiceCache.get(text);
    if (!url) {
      const r = await speakAsJonathan({ data: { text } });
      if (!r.ok) throw new Error(r.error);
      url = `data:audio/mpeg;base64,${r.audio}`;
      voiceCache.set(text, url);
    }
    if (seq !== speakSeq) return;
    currentAudio = new Audio(url);
    await currentAudio.play();
  } catch (e) {
    if (seq !== speakSeq) return;
    if (e instanceof DOMException && e.name === "NotAllowedError") return; // needs a tap first
    fallbackSpeak(text);
  }
}

type Payload = { audio: { data: string; mime: string }; sketch?: string | undefined; text?: string | undefined };

function SessionPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchState = useServerFn(getSessionState);
  const sendTurn = useServerFn(nourTurn);
  const askHint = useServerFn(requestHint);
  const saveSolution = useServerFn(saveWrittenSolution);
  const key = ["session", sessionId];
  const q = useQuery({ queryKey: key, queryFn: () => fetchState({ data: { sessionId } }) });
  const state = q.data;

  const [busy, setBusy] = useState(false);
  const [hinting, setHinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [notes, setNotes] = useState("");
  const [page, setPage] = useState<"solution" | "drawing">("solution");
  const [saveStatus, setSaveStatus] = useState("Saved");
  const initialized = useRef(false);
  const notesRef = useRef("");
  const lastSaved = useRef("");
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const [now, setNow] = useState(() => Date.now());
  const lastPayload = useRef<Payload | null>(null);
  const journal = useRef<JournalHandle | null>(null);
  const spokenFirst = useRef(false);
  const lastSpokenId = useRef<string | null>(null);

  useEffect(() => {
    if (!state || initialized.current) return;
    initialized.current = true;
    setNotes(state.solution);
    notesRef.current = state.solution;
    lastSaved.current = state.solution;
  }, [state]);

  const persist = useCallback(() => {
    const text = notesRef.current;
    const operation = saveQueue.current.catch(() => {}).then(async () => {
      if (text === lastSaved.current) return;
      setSaveStatus("Saving…");
      await saveSolution({ data: { sessionId, text } });
      lastSaved.current = text;
      setSaveStatus(notesRef.current === text ? "Saved" : "Unsaved changes");
    });
    saveQueue.current = operation;
    return operation;
  }, [saveSolution, sessionId]);

  useEffect(() => {
    if (!initialized.current || notes === lastSaved.current) return;
    const timer = setTimeout(() => { void persist().catch(() => setSaveStatus("Not saved — retry")); }, 800);
    return () => clearTimeout(timer);
  }, [notes, persist]);

  function updateNotes(text: string) {
    notesRef.current = text;
    setNotes(text);
    setSaveStatus("Unsaved changes");
  }

  useEffect(() => {
    if (page !== "drawing") return;
    const frame = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    return () => cancelAnimationFrame(frame);
  }, [page]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (state?.completed) navigate({ to: "/student/result/$sessionId", params: { sessionId }, replace: true });
  }, [state?.completed, navigate, sessionId]);
  useEffect(() => () => { if (typeof window !== "undefined") stopVoice(); }, []);

  const remaining = state ? Math.max(0, state.deadline - now) : null;
  const timeUp = remaining === 0;
  const allDone = state ? state.activeIndex < 0 : false;

  const goQuiz = useCallback(async () => {
    try { await persist(); } catch (e) { setError(errMsg(e)); return; }
    stopVoice();
    navigate({ to: "/student/quiz/$sessionId", params: { sessionId } });
  }, [navigate, sessionId, persist]);

  useEffect(() => {
    if (timeUp && state && !state.completed) {
      toast.info("Time's up! Let's see how Jonathan does on his test.");
      goQuiz();
    }
  }, [timeUp]); // eslint-disable-line react-hooks/exhaustive-deps

  const nourTurns = state?.turns.filter((t) => t.speaker === "nour" || t.speaker === "system") ?? [];
  const latest = [...nourTurns].reverse().find((t) => t.speaker === "nour");
  const latestId = latest?.id;

  // Once the student has tapped "Play Jonathan's voice" (the browser requires
  // one tap before audio can start on its own), Jonathan speaks every new
  // message automatically — including when he moves on to the next idea.
  useEffect(() => {
    if (!spokenFirst.current || !voiceOn || !latestId || busy) return;
    if (lastSpokenId.current === latestId) return;
    lastSpokenId.current = latestId;
    const t = state?.turns.find((x) => x.id === latestId);
    if (t) speak(t.text);
  }, [latestId, voiceOn, busy, state]);

  async function submit(payload: Payload) {
    if (busy) return;
    setBusy(true);
    setError(null);
    lastPayload.current = payload;
    try {
      await persist();
      const r = await sendTurn({ data: { sessionId, ...payload } });
      if (!r.ok) {
        if (r.code === "time_up" || r.code === "all_done" || r.code === "completed") {
          toast.info(r.error);
          goQuiz();
          return;
        }
        setError(r.error);
        return;
      }
      lastPayload.current = null;
      qc.setQueryData(key, r.state);
      if (r.transition === "fixed") {
        toast.success("Jonathan understands that one now!");
        journal.current?.clear();
      }
      // Jonathan's reply is spoken by the auto-speak effect above once the
      // new turn lands in state (after the first user tap unlocks audio).
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function hint() {
    if (hinting) return;
    setHinting(true);
    try {
      const r = await askHint({ data: { sessionId } });
      if (r.penalty) toast.warning("Graded mode: using a hint on this idea takes 1 point off your adjusted score.");
      await q.refetch();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setHinting(false);
    }
  }

  if (q.isLoading) {
    return (
      <div className="min-h-screen bg-night p-6">
        <Skeleton className="mx-auto h-[70vh] max-w-6xl rounded-3xl bg-midnight-soft" />
      </div>
    );
  }
  if (q.isError || !state) {
    return (
      <div className="min-h-screen bg-night p-6">
        <ErrorPanel className="mx-auto max-w-md" message={errMsg(q.error) || "Couldn't load this session."} onRetry={() => q.refetch()} />
      </div>
    );
  }

  const mood: Mood = busy ? "thinking" : (latest?.mood ?? "curious");
  const mm = remaining !== null ? Math.floor(remaining / 60000) : 0;
  const ss = remaining !== null ? Math.floor((remaining % 60000) / 1000) : 0;
  const earlier = nourTurns.filter((t) => t.id !== latest?.id).slice(-4);

  return (
    <div className="min-h-[100dvh] bg-night text-midnight-foreground">
      <TopBar
        tone="light"
        right={
          <>
            <span className={cn("rounded-full px-3 py-1 text-xs font-bold tabular-nums", remaining !== null && remaining < 60000 ? "bg-wrong/25" : "bg-midnight-soft")} aria-label="Time remaining">
              {mm}:{ss.toString().padStart(2, "0")}
            </span>
            <Button
              variant="night"
              size="icon"
              aria-pressed={voiceOn}
              aria-label={voiceOn ? "Mute Jonathan" : "Let Jonathan speak"}
              onClick={() => {
                const next = !voiceOn;
                setVoiceOn(next);
                if (!next) stopVoice();
                
              }}
            >
              {voiceOn ? <Volume2 /> : <VolumeX />}
            </Button>
            <Button variant="night" size="sm" onClick={goQuiz}><Flag /> Done</Button>
          </>
        }
      />

      <main className="grid min-h-[calc(100dvh-80px)] gap-0 px-3 pb-4 sm:px-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Jonathan's page */}
        <section className="relative bg-card p-5 text-card-foreground lg:order-2 lg:border-l-2 lg:border-border" aria-live="polite">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">{state.title}</p>
          <div className="mt-2"><UnderstandingMeter slots={state.slots} /></div>
          <div className="mt-5 flex items-start gap-4">
            <Nour mood={mood} size={72} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground">Jonathan says</p>
              {busy ? (
                <div className="mt-2"><ThinkingDots /></div>
              ) : (
                <p className="mt-1 font-hand text-2xl leading-snug">{latest?.text ?? "Hi! Teach me, I'm listening."}</p>
              )}
              {latest && !busy && (
                <button className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary" onClick={() => speak(latest.text)}>
                  <Volume2 className="h-3.5 w-3.5" /> Hear again
                </button>
              )}
            </div>
          </div>
          {earlier.length > 0 && (
            <div className="mt-6 space-y-2 border-t border-dashed border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Earlier notes</p>
              {earlier.map((t) => (
                <p key={t.id} className={cn("font-hand text-lg leading-snug text-muted-foreground", t.kind === "hint" && "text-primary")}>
                  {t.kind === "hint" && <Lightbulb className="mr-1 inline h-4 w-4" />}
                  {t.text}
                </p>
              ))}
            </div>
          )}
          {!spokenFirst.current && latest && voiceOn && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { spokenFirst.current = true; lastSpokenId.current = latest.id; speak(latest.text); }}>
              <Volume2 /> Play Jonathan's voice
            </Button>
          )}
        </section>

        {/* Student's page */}
        <section className="min-w-0 bg-card p-4 text-card-foreground lg:order-1 sm:p-6">
          <div className="mb-4 flex gap-3" role="tablist" aria-label="Notebook pages">
            <Button role="tab" aria-selected={page === "solution"} variant={page === "solution" ? "default" : "outline"} onClick={() => setPage("solution")}><PenLine /> Written solution</Button>
            <Button role="tab" aria-selected={page === "drawing"} variant={page === "drawing" ? "default" : "outline"} onClick={() => setPage("drawing")}><Eraser /> Thinking drawings</Button>
          </div>
          <div hidden={page !== "drawing"}><Journal ref={journal} disabled={busy} /></div>
          <div hidden={page !== "solution"}><SolutionDocument value={notes} onChange={updateNotes} math={hasMathKeyboard(state.subject)} disabled={busy} saveStatus={saveStatus} onSave={() => { void persist().catch((e) => setError(errMsg(e))); }} /></div>
          <div className="mt-4 space-y-3">
            {error && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-wrong/15 px-4 py-2 text-sm">
                <span>{error}</span>
                {lastPayload.current && (
                  <button className="font-semibold underline underline-offset-4" onClick={() => lastPayload.current && submit(lastPayload.current)} disabled={busy}>Retry</button>
                )}
              </div>
            )}
            {voiceNote && <p className="text-sm text-muted-foreground" role="status">{voiceNote}</p>}
            {allDone ? (
              <Button variant="glow" size="lg" className="w-full" onClick={goQuiz}>See Jonathan's test <ArrowRight /></Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Recorder
                  disabled={busy}
                  onNote={setVoiceNote}
                  onStart={() => { spokenFirst.current = true; stopVoice(); }}
                  onClip={(audio) => submit({ audio, sketch: journal.current?.snapshot() ?? undefined, text: notes.trim() || undefined })}
                />
                <Button variant="outline" onClick={hint} disabled={hinting || busy}>
                  {hinting ? <Loader2 className="animate-spin" /> : <Lightbulb />} Stuck?
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Talk for at least 10 seconds.
              {state.mode === "graded" && " Graded: each idea you use a hint on takes 1 point off your adjusted score."}
            </p>
            <p className="text-center text-xs text-muted-foreground">
              <Button variant="ghost" size="sm" onClick={async () => { try { await persist(); await navigate({ to: "/student" }); } catch (e) { setError(errMsg(e)); } }}>Back to assignments</Button>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------------- Journal canvas ---------------- */

type JournalHandle = { clear: () => void; snapshot: () => string | null };
type Tool = "pen" | "eraser";
const INKS = ["--foreground", "--primary", "--wrong", "--fixed"] as const;

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "black";
}

function Journal({ ref, disabled }: { ref: React.Ref<JournalHandle>; disabled: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [ink, setInk] = useState<(typeof INKS)[number]>("--foreground");

  const resize = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const prev = dirty.current ? c.toDataURL() : null;
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    if (prev) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, r.width, r.height);
      img.src = prev;
    }
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const clear = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    dirty.current = false;
  }, []);

  if (typeof ref === "function") ref({ clear, snapshot: () => snap() });
  else if (ref) (ref as React.RefObject<JournalHandle | null>).current = { clear, snapshot: () => snap() };

  function snap(): string | null {
    const c = canvas.current;
    if (!c || !dirty.current) return null;
    const out = document.createElement("canvas");
    const scale = Math.min(1, 1024 / c.width);
    out.width = Math.round(c.width * scale);
    out.height = Math.round(c.height * scale);
    const o = out.getContext("2d");
    if (!o) return null;
    o.fillStyle = cssVar("--card");
    o.fillRect(0, 0, out.width, out.height);
    o.drawImage(c, 0, 0, out.width, out.height);
    return out.toDataURL("image/jpeg", 0.8);
  }

  function pos(e: React.PointerEvent) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = cssVar(ink);
    ctx.lineWidth = tool === "eraser" ? 22 : 3 * (e.pressure > 0 && e.pointerType === "pen" ? 0.5 + e.pressure : 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y + 0.01);
    ctx.stroke();
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (tool === "pen") dirty.current = true;
  }
  function up() {
    drawing.current = false;
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-hand text-xl">My journal</span>
        <Button size="sm" variant={tool === "pen" ? "default" : "outline"} onClick={() => setTool("pen")} aria-pressed={tool === "pen"}><PenLine /> Pen</Button>
        <Button size="sm" variant={tool === "eraser" ? "default" : "outline"} onClick={() => setTool("eraser")} aria-pressed={tool === "eraser"}><Eraser /> Eraser</Button>
        <div className="flex items-center gap-1.5 px-1" role="radiogroup" aria-label="Ink colour">
          {INKS.map((v) => (
            <button
              key={v}
              role="radio"
              aria-checked={ink === v}
              aria-label={`Ink ${v.slice(2)}`}
              onClick={() => { setInk(v); setTool("pen"); }}
              className={cn("h-6 w-6 rounded-full border-2", ink === v && tool === "pen" ? "border-ring scale-110" : "border-transparent")}
              style={{ background: `var(${v})` }}
            />
          ))}
        </div>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={clear}><Trash2 /> New page</Button>
      </div>
      <canvas
        ref={canvas}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        aria-label="Journal page: draw or write with your finger, pen or mouse"
        className={cn("h-[62dvh] min-h-72 w-full touch-none rounded-2xl border border-border", tool === "eraser" ? "cursor-cell" : "cursor-crosshair")}
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 31px, color-mix(in oklab, var(--primary) 18%, transparent) 31px 32px)",
        }}
      />
    </div>
  );
}

/* ---------------- Recorder (tap to start / stop, min 30s) ---------------- */

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return null;
}

function Recorder({ disabled, onClip, onNote, onStart }: { disabled: boolean; onClip: (a: { data: string; mime: string }) => void; onNote: (s: string | null) => void; onStart: () => void }) {
  const [rec, setRec] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mr = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const cancelled = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setRec(false);
  }, []);

  useEffect(() => () => {
    cancelled.current = true;
    try { mr.current?.stop(); } catch { /* noop */ }
    cleanup();
  }, [cleanup]);

  async function start() {
    if (disabled || rec) return;
    const mime = pickMime();
    if (!mime || !navigator.mediaDevices?.getUserMedia) {
      onNote("Voice recording isn't supported in this browser. Try Chrome, Edge or Safari.");
      return;
    }
    try {
      cancelled.current = false;
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const r = new MediaRecorder(s, { mimeType: mime, audioBitsPerSecond: 32000 });
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = async () => {
        cleanup();
        const blob = new Blob(chunks.current, { type: r.mimeType || mime });
        chunks.current = [];
        if (cancelled.current) return;
        if (blob.size > 2_900_000) {
          onNote("That recording was too large. Try a shorter explanation.");
          return;
        }
        const buf = new Uint8Array(await blob.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        onNote(null);
        onClip({ data: btoa(bin), mime: blob.type });
      };
      mr.current = r;
      startedAt.current = Date.now();
      r.start(1000);
      onStart();
      onNote(null);
      setRec(true);
      setElapsed(0);
      timer.current = setInterval(() => {
        const ms = Date.now() - startedAt.current;
        setElapsed(ms);
        if (ms >= MAX_REC_MS) finish();
      }, 200);
    } catch {
      cleanup();
      onNote("Microphone access was blocked. Allow it in your browser settings to teach Jonathan.");
    }
  }

  function finish() {
    if (mr.current && mr.current.state === "recording") mr.current.stop();
  }
  function cancel() {
    cancelled.current = true;
    finish();
    onNote("Recording discarded.");
  }

  const secs = Math.floor(elapsed / 1000);
  const ready = canFinishExplanation(elapsed);
  const pct = Math.min(100, (elapsed / MIN_REC_MS) * 100);

  if (!rec) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={start}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-orb font-semibold text-midnight shadow-glow transition disabled:opacity-50"
      >
        {disabled ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
        {disabled ? "Jonathan is thinking…" : "Start explaining"}
      </button>
    );
  }
  return (
    <div className="flex flex-1 items-center gap-2">
      <button
        type="button"
        onClick={finish}
        disabled={!ready}
        aria-label={ready ? "Finish and send to Jonathan" : `Keep talking, ${10 - secs} seconds to go`}
        className="relative flex h-12 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground"
      >
        <span className="absolute inset-y-0 left-0 bg-primary/25 transition-all" style={{ width: `${pct}%` }} aria-hidden />
        <span className="relative flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-wrong" />
          {ready ? <><Square className="h-4 w-4" /> Finish · {secs}s</> : <>Listening… keep going {10 - secs}s</>}
        </span>
      </button>
      <Button variant="ghost" size="sm" onClick={cancel}>Cancel</Button>
    </div>
  );
}
