import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), create: vi.fn(async () => ({ id: "saved-assignment" })),
  invalidate: vi.fn(async () => {}),
  search: { topicId: "complex" },
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: object) => ({ ...config, useSearch: () => mocks.search }),
  useNavigate: () => mocks.navigate,
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/nour/api.functions", () => ({ createAssignment: mocks.create, listTopics: vi.fn() }));
const confusion = (code: string, question: string) => ({
  id: code, code, title: code, sort_order: 1, nour_says: "A wrong idea", accepted_reasons: ["A reason"],
  quiz_question: question, answer_if_fixed: "Correct", answer_if_not: "Trap", short_explanation: "Explanation", hint: "", nudge: "",
});
const topics = [
  { id: "fractions", title: "Comparing and adding fractions", grade_level: 5, subject: "Maths", confusions: [confusion("F1", "Which fraction is larger?")] },
  { id: "complex", title: "Complex Numbers", grade_level: 11, subject: "Maths", confusions: [confusion("C1", "What is the modulus of 5 - 12i?")] },
];
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: topics, isLoading: false, isError: false }),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));
vi.mock("@/components/nour/Shell", () => ({ TopBar: () => null, ErrorPanel: () => null, errMsg: String }));
vi.mock("@/components/ui/switch", () => ({ Switch: () => null }));
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) =>
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>{children}</select>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectTrigger: () => null, SelectValue: () => null,
}));
import { Route } from "@/routes/teacher.assignments.new";
const Builder = (Route as unknown as { component: React.ComponentType }).component;
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("assignment topic handoff", () => {
  it("initializes the new topic's title and questions rather than the first library topic", async () => {
    render(<Builder />);
    await waitFor(() => expect(screen.getAllByLabelText("Title", { exact: true })[0]).toHaveValue("Complex Numbers"));
    expect(screen.getByLabelText("Question", { exact: true })).toHaveValue("What is the modulus of 5 - 12i?");
  });
  it("saves the teacher's title and test question with the selected topic", async () => {
    render(<Builder />);
    const title = screen.getAllByLabelText("Title", { exact: true })[0];
    if (!title) throw new Error("Assignment title input missing");
    await waitFor(() => expect(title).toHaveValue("Complex Numbers"));
    fireEvent.change(title, { target: { value: "My complex numbers test" } });
    fireEvent.change(screen.getByLabelText("Question", { exact: true }), { target: { value: "Find the modulus of 8 + 15i." } });
    fireEvent.submit(screen.getByRole("button", { name: "Save assignment" }).closest("form") as HTMLFormElement);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      title: "My complex numbers test", topicId: "complex",
      testQuestions: [expect.objectContaining({ code: "C1", question: "Find the modulus of 8 + 15i." })],
    }) }));
  });
  it("does not overwrite a teacher title when selecting a different topic", async () => {
    render(<Builder />);
    const title = screen.getAllByLabelText("Title", { exact: true })[0];
    if (!title) throw new Error("Assignment title input missing");
    await waitFor(() => expect(title).toHaveValue("Complex Numbers"));
    fireEvent.change(title, { target: { value: "My lesson" } });
    fireEvent.change(screen.getByLabelText("Topic", { exact: true }), { target: { value: "fractions" } });
    expect(title).toHaveValue("My lesson");
  });
});