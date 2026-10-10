// Pure, deterministic rules for Teach Nour. No I/O here — server functions
// call these, and unit tests cover them directly.

export type Status = "locked" | "fixed" | "taught_wrong";
export type Mood = "curious" | "thinking" | "excited" | "confused" | "neutral";
export type Mode = "practice" | "graded";

export const STATUSES: Status[] = ["locked", "fixed", "taught_wrong"];
export const MOODS: Mood[] = ["curious", "thinking", "excited", "confused", "neutral"];

export function normalizeText(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "")
    .replace(/[^\p{L}\p{N}\s/+=-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True only if the quote is a genuine, ordered, contiguous substring of the transcript. */
export function quoteInTranscript(quote: string, transcript: string): boolean {
  const q = normalizeText(quote ?? "");
  if (q.length < 4) return false;
  return ` ${normalizeText(transcript)} `.includes(` ${q} `) || normalizeText(transcript).includes(q);
}

export interface AiProposal {
  transcript: string;
  proposed_status: Status;
  evidence_quote: string;
  reason_present: boolean;
  concrete_example_present: boolean;
  reason_summary: string;
  nour_reply: string;
  nour_mood: Mood;
}

export function parseAiProposal(raw: unknown): AiProposal | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Record<keyof AiProposal, unknown>>;
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  const transcript = str(r.transcript);
  const status = str(r.proposed_status) as Status | null;
  const quote = str(r.evidence_quote);
  const summary = str(r.reason_summary);
  const reply = str(r.nour_reply);
  const mood = str(r.nour_mood) as Mood | null;
  if (transcript === null || quote === null || summary === null || reply === null) return null;
  if (!status || !STATUSES.includes(status)) return null;
  if (!mood || !MOODS.includes(mood)) return null;
  if (typeof r.reason_present !== "boolean" || typeof r.concrete_example_present !== "boolean") return null;
  const trimmed = reply.trim();
  if (!trimmed || trimmed.length > 400) return null;
  return {
    transcript,
    proposed_status: status,
    evidence_quote: quote,
    reason_present: r.reason_present,
    concrete_example_present: r.concrete_example_present,
    reason_summary: summary.slice(0, 300),
    nour_reply: trimmed,
    nour_mood: mood,
  };
}

export interface TransitionDecision {
  newStatus: Status;
  accepted: boolean;
  evidenceQuote: string | null;
  rejectionReason: string | null;
}

/**
 * The server-owned state machine. Only locked -> fixed / locked -> taught_wrong
 * are allowed, and only with an evidence quote that exists in the student's
 * own transcript. `fixed` additionally requires both a reason and an example.
 */
export function decideTransition(
  current: Status,
  proposal: AiProposal,
  studentTranscript: string,
): TransitionDecision {
  const keep = (why: string): TransitionDecision => ({
    newStatus: current,
    accepted: false,
    evidenceQuote: null,
    rejectionReason: why,
  });
  if (proposal.proposed_status === "locked") return keep("no_transition_proposed");
  if (current !== "locked") return keep("already_processed");
  if (!quoteInTranscript(proposal.evidence_quote, studentTranscript)) return keep("evidence_failed");
  if (proposal.proposed_status === "fixed" && !(proposal.reason_present && proposal.concrete_example_present)) {
    return keep("missing_reason_or_example");
  }
  return {
    newStatus: proposal.proposed_status,
    accepted: true,
    evidenceQuote: proposal.evidence_quote.trim(),
    rejectionReason: null,
  };
}

export function effectiveStatus(sc: { status: Status; teacher_override_status: Status | null }): Status {
  return sc.teacher_override_status ?? sc.status;
}

/** Index of the active confusion: the first still-locked one in order, or -1. */
export function activeIndex(statuses: Status[]): number {
  return statuses.findIndex((s) => s === "locked");
}

export interface QuizConfusion {
  id: string;
  code: string;
  title: string;
  quiz_question: string;
  answer_if_fixed: string;
  answer_if_not: string;
  short_explanation: string;
}

export interface QuizCard {
  confusionId: string;
  code: string;
  title: string;
  question: string;
  nourAnswer: string;
  correct: boolean;
  status: Status;
  evidenceQuote: string | null;
  note: string | null;
  explanation: string;
}

export function buildQuiz(
  items: { confusion: QuizConfusion; status: Status; evidenceQuote: string | null }[],
): QuizCard[] {
  return items.map(({ confusion: c, status, evidenceQuote }) => {
    const fixed = status === "fixed";
    return {
      confusionId: c.id,
      code: c.code,
      title: c.title,
      question: c.quiz_question,
      nourAnswer: fixed ? c.answer_if_fixed : c.answer_if_not,
      correct: fixed,
      status,
      evidenceQuote: fixed ? evidenceQuote : null,
      note:
        status === "taught_wrong"
          ? "Nour learned a different rule from the explanation, so it still answered this one wrong. That's a great one to practise."
          : status === "locked"
            ? "Nour never got convinced on this idea, so it kept its old belief."
            : null,
      explanation: c.short_explanation,
    };
  });
}

export function computeScores(
  mode: Mode,
  statuses: Status[],
  hintedCount: number,
): { raw: number; adjusted: number; total: number } {
  const total = statuses.length;
  const raw = statuses.filter((s) => s === "fixed").length;
  const adjusted = mode === "graded" ? Math.min(total, Math.max(0, raw - hintedCount)) : raw;
  return { raw, adjusted, total };
}

export interface HeatRow {
  isSample: boolean;
  completed: boolean;
  statuses: Status[];
}

/** Dynamic dashboard headline: finds the misconception most students could not fix. */
export function buildInsight(rows: HeatRow[], titles: string[]): string | null {
  const done = rows.filter((r) => r.completed);
  if (!done.length || !titles.length) return null;
  let worst = 0;
  let worstCount = -1;
  titles.forEach((_, i) => {
    const n = done.filter((r) => r.statuses[i] && r.statuses[i] !== "fixed").length;
    if (n > worstCount) {
      worstCount = n;
      worst = i;
    }
  });
  const t0 = titles[worst] ?? "";
  const title = t0.charAt(0).toLowerCase() + t0.slice(1);
  if (worstCount === 0) return `All ${done.length} students fixed every misconception. Move on with confidence.`;
  return `${worstCount} of ${done.length} students could not fix "${title}". Reteach it tomorrow.`;
}

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/** A teacher-written test question, tied to one misconception by its code. */
export interface TestQuestion {
  code: string;
  question: string;
  correct_answer: string;
  trap_answer: string;
}

/**
 * Jonathan takes the teacher's own test. Each answer is decided deterministically by
 * the status of the misconception the question tests: fixed → correct answer, otherwise the trap.
 * Questions whose code doesn't match any misconception are dropped.
 */
export function buildTeacherTest(
  questions: TestQuestion[],
  items: { confusion: QuizConfusion; status: Status; evidenceQuote: string | null }[],
): QuizCard[] {
  const byCode = new Map(items.map((i) => [i.confusion.code, i]));
  const out: QuizCard[] = [];
  questions.forEach((q, n) => {
    const it = byCode.get(q.code);
    if (!it) return;
    const fixed = it.status === "fixed";
    out.push({
      confusionId: `${it.confusion.id}:${n}`,
      code: it.confusion.code,
      title: it.confusion.title,
      question: q.question,
      nourAnswer: fixed ? q.correct_answer : q.trap_answer,
      correct: fixed,
      status: it.status,
      evidenceQuote: fixed ? it.evidenceQuote : null,
      note:
        it.status === "taught_wrong"
          ? "Jonathan used the rule he was taught, but it was the wrong rule, so he fell into the trap."
          : it.status === "locked"
            ? "Jonathan was never convinced on this idea, so he kept his old belief."
            : null,
      explanation: it.confusion.short_explanation,
    });
  });
  return out;
}

/** Test score: one point per correct answer; in graded mode each answer on a hinted idea loses its point. */
export function scoreTest(mode: Mode, cards: QuizCard[], hintedCodes: string[]): { raw: number; adjusted: number; total: number } {
  const total = cards.length;
  const raw = cards.filter((c) => c.correct).length;
  const lost = mode === "graded" ? cards.filter((c) => c.correct && hintedCodes.includes(c.code)).length : 0;
  return { raw, adjusted: Math.max(0, raw - lost), total };
}
