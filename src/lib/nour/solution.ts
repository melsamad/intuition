export const MIN_EXPLANATION_MS = 10_000;
export const MAX_SOLUTION_LENGTH = 12_000;

export function canFinishExplanation(elapsed: number) {
  return elapsed >= MIN_EXPLANATION_MS;
}

export function validateSolution(text: unknown): string {
  if (typeof text !== "string" || text.length > MAX_SOLUTION_LENGTH) {
    throw new Error("Keep your written solution under 12,000 characters.");
  }
  return text;
}

export function hasMathKeyboard(subject: string) {
  return /math|science|physics|chemistry|biology/i.test(subject);
}

export function insertSolutionSymbol(text: string, start: number, end: number, symbol: string) {
  return text.slice(0, start) + symbol + text.slice(end);
}

export function savedSolution(turns: { metadata: unknown }[]) {
  const turn = turns.find((t) => (t.metadata as Record<string, unknown> | null)?.["kind"] === "solution");
  const text = (turn?.metadata as Record<string, unknown> | undefined)?.["solution"];
  return typeof text === "string" ? text : "";
}