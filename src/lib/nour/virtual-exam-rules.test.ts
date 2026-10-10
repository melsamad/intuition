import { describe, expect, it } from "vitest";
import { acceptsWrites, attemptDeadline, canStartAttempt, shouldAutoSubmit, timePerQuestion, verifyQuote, SUBMIT_GRACE_MS } from "./virtual-exam-rules";

const now = Date.parse("2026-10-10T10:00:00Z");

describe("virtual exam rules", () => {
  it("allows one attempt by default and blocks the second", () => {
    expect(canStartAttempt({ maxAttempts: 1, usedAttempts: 0, dueAt: null, isActive: true, now }).ok).toBe(true);
    expect(canStartAttempt({ maxAttempts: 1, usedAttempts: 1, dueAt: null, isActive: true, now }).ok).toBe(false);
  });
  it("blocks starting after the due date", () => {
    expect(canStartAttempt({ maxAttempts: 3, usedAttempts: 0, dueAt: "2026-10-10T09:00:00Z", isActive: true, now }).ok).toBe(false);
  });
  it("deadline is start + duration, capped by due date", () => {
    expect(attemptDeadline(now, 30, null)).toBe(now + 30 * 60_000);
    expect(attemptDeadline(now, 30, "2026-10-10T10:10:00Z")).toBe(now + 10 * 60_000);
  });
  it("rejects writes after the grace window and auto-submits", () => {
    expect(acceptsWrites(now, now + SUBMIT_GRACE_MS)).toBe(true);
    expect(acceptsWrites(now, now + SUBMIT_GRACE_MS + 1)).toBe(false);
    expect(shouldAutoSubmit("in_progress", now, now + SUBMIT_GRACE_MS + 1)).toBe(true);
    expect(shouldAutoSubmit("submitted", now, now + SUBMIT_GRACE_MS + 1)).toBe(false);
  });
  it("time per question starts from recorded time", () => {
    const rows = timePerQuestion({ questionCount: 2, recordings: [{ questionNumber: 1, durationMs: 60_000, transcript: "a b" }], notes: {}, totalMs: 60_000 });
    expect(rows[0]!.estimatedMs).toBe(60_000);
    expect(rows[1]!.estimatedMs).toBe(0);
  });
  it("a quote counts as evidence only if it appears in the student's work", () => {
    expect(verifyQuote("bigger  bottom", "The bigger bottom means smaller pieces")).toBe(true);
    expect(verifyQuote("invented words", "The bigger bottom")).toBe(false);
  });
});
