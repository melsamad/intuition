// Pure, deterministic rules for "My Virtual Exam". Server code decides; the AI only describes.

/** Seconds after the deadline during which a final autosave/submit is still accepted (network lag). */
export const SUBMIT_GRACE_MS = 20_000;
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_NOTE_LENGTH = 12_000;

export type StartCheck = { ok: true } | { ok: false; reason: string };

export function canStartAttempt(opts: { maxAttempts: number; usedAttempts: number; dueAt: string | null; isActive: boolean; now: number }): StartCheck {
  if (!opts.isActive) return { ok: false, reason: "This exam is no longer available." };
  if (opts.dueAt && opts.now > Date.parse(opts.dueAt)) return { ok: false, reason: "The deadline for this exam has passed." };
  if (opts.usedAttempts >= opts.maxAttempts) {
    return { ok: false, reason: opts.maxAttempts === 1 ? "You have already used your one attempt." : `You have used all ${opts.maxAttempts} attempts.` };
  }
  return { ok: true };
}

/** Attempt deadline = start + duration, but never later than the exam's due date. */
export function attemptDeadline(startedAt: number, durationMinutes: number, dueAt: string | null): number {
  const end = startedAt + durationMinutes * 60_000;
  return dueAt ? Math.min(end, Date.parse(dueAt)) : end;
}

/** Writes are allowed until the deadline plus a short grace window. */
export function acceptsWrites(deadline: number, now: number): boolean {
  return now <= deadline + SUBMIT_GRACE_MS;
}

/** An in-progress attempt past its grace window must be closed as auto-submitted. */
export function shouldAutoSubmit(status: string, deadline: number, now: number): boolean {
  return status === "in_progress" && !acceptsWrites(deadline, now);
}

export function cleanQuestionNotes(raw: unknown, questionCount: number): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(k);
    if (!Number.isInteger(n) || n < 1 || n > questionCount || typeof v !== "string") continue;
    if (v.length > MAX_NOTE_LENGTH) throw new Error(`Question ${n} notes are too long.`);
    if (v.trim()) out[String(n)] = v;
  }
  return out;
}

export type RecordingFact = { questionNumber: number; durationMs: number; transcript: string };

/**
 * Evidence-based time per question: sum of recorded explanation time per question,
 * plus the remaining exam time split by share of written + spoken words (marked as estimate).
 */
export function timePerQuestion(opts: { questionCount: number; recordings: RecordingFact[]; notes: Record<string, string>; totalMs: number }) {
  const rows = Array.from({ length: opts.questionCount }, (_, i) => {
    const q = i + 1;
    const recs = opts.recordings.filter((r) => r.questionNumber === q);
    const recordedMs = recs.reduce((s, r) => s + Math.max(0, r.durationMs), 0);
    const words = wordsIn(opts.notes[String(q)] ?? "") + recs.reduce((s, r) => s + wordsIn(r.transcript), 0);
    return { question: q, recordedMs, recordings: recs.length, words, estimatedMs: 0 };
  });
  const recordedTotal = rows.reduce((s, r) => s + r.recordedMs, 0);
  const remaining = Math.max(0, opts.totalMs - recordedTotal);
  const wordTotal = rows.reduce((s, r) => s + r.words, 0);
  for (const r of rows) r.estimatedMs = Math.round(r.recordedMs + (wordTotal ? (remaining * r.words) / wordTotal : 0));
  return rows;
}

export function wordsIn(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

/** An AI "evidence" claim stays evidence only if its quote is really in the student's work. */
export function verifyQuote(quote: string, corpus: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const q = norm(quote);
  return q.length >= 4 && norm(corpus).includes(q);
}
