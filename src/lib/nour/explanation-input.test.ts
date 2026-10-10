import { describe, expect, it } from "vitest";
import { blockExplanationInsertion } from "./explanation-input";

describe("student explanation input", () => {
  it("cancels paste so clipboard text cannot be inserted", () => {
    const event = new Event("paste", { cancelable: true });
    blockExplanationInsertion(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("cancels text drops so dragging text cannot bypass the paste restriction", () => {
    const event = new Event("drop", { cancelable: true });
    blockExplanationInsertion(event);
    expect(event.defaultPrevented).toBe(true);
  });
});