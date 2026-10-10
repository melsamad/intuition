import { describe, expect, it } from "vitest";
import { canFinishExplanation, hasMathKeyboard, insertSolutionSymbol, validateSolution, savedSolution } from "./solution";

describe("solution notebook rules", () => {
  it("allows sending at 10 seconds, not before", () => {
    expect(canFinishExplanation(9_999)).toBe(false);
    expect(canFinishExplanation(10_000)).toBe(true);
  });
  it("enables the symbol keyboard for math and science", () => {
    expect(hasMathKeyboard("Maths")).toBe(true);
    expect(hasMathKeyboard("Science")).toBe(true);
    expect(hasMathKeyboard("History")).toBe(false);
  });
  it("keeps formulas, text and blank lines separate from drawings", () => {
    const text = "My solution\n\n$x^2 = 4$\nSo x = ±2.";
    expect(validateSolution(text)).toBe(text);
    expect(savedSolution([{ metadata: { kind: "solution", solution: text } }])).toBe(text);
  });
  it("inserts a symbol at the cursor without removing surrounding work", () => {
    expect(insertSolutionSymbol("x = 4", 4, 5, "√4")).toBe("x = √4");
  });
});