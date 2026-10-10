import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { BookOpen, CalendarClock, Clock, Flame, Loader2, Play, Plus, RotateCcw, X, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { getStudentHome, startSession, getPastExams } from "@/lib/nour/api.functions";
import { Nour } from "@/components/nour/Nour";
import { StudentVirtualExams } from "@/components/nour/StudentVirtualExams";
import { ErrorPanel, TopBar, errMsg } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "Student dashboard — Teach Jonathan" },
      { name: "description", content: "Your calendar, to-do list, upcoming tests, homework and daily streak." },
      { property: "og:title", content: "Student dashboard — Teach Jonathan" },
      { property: "og:description", content: "Keep your streak alive by teaching Jonathan one idea every day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentHome,
});

const ALIAS_KEY = "intuition-alias";
const STREAK_KEY = "jonathan-streak-days";
const TODO_KEY = "jonathan-todos";
type Todo = { id: string; text: string; done: boolean };
const DEFAULT_TODOS: Todo[] = [
  { id: "1", text: "Teach Jonathan one idea", done: false },
  { id: "2", text: "Review yesterday's notes", done: false },
  { id: "3", text: "Ask my parents the dinner question", done: false },
];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

function streakCount(days: string[]) {
  const set = new Set(days);
  const d = new Date();
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

const notebookLines = {
  backgroundImage:
    "linear-gradient(90deg, transparent 2.6rem, var(--wrong) 2.6rem, var(--wrong) calc(2.6rem + 2px), transparent calc(2.6rem + 2px)), repeating-linear-gradient(transparent 0 2.2rem, color-mix(in oklch, var(--chart-1) 35%, transparent) 2.2rem calc(2.2rem + 1px))",
};

function StudentHome() {
  const fetchHome = useServerFn(getStudentHome);
  const start = useServerFn(startSession);
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["student-home"], queryFn: () => fetchHome() });
  const [alias, setAlias] = useState("Demo Student");
  const fetchPast = useServerFn(getPastExams);
  const history = useQuery({ queryKey: ["past-exams", alias.trim() || "Demo Student"], queryFn: () => fetchPast({ data: { studentName: alias.trim() || "Demo Student" } }) });
  const [starting, setStarting] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [todos, setTodos] = useState<Todo[]>(DEFAULT_TODOS);
  const [newTodo, setNewTodo] = useState("");
  const lock = useRef(false);

  useEffect(() => {
    setToday(new Date());
    const saved = localStorage.getItem(ALIAS_KEY);
    if (saved) setAlias(saved);
    try {
      setDays(JSON.parse(localStorage.getItem(STREAK_KEY) || "[]"));
      const t = localStorage.getItem(TODO_KEY);
      if (t) setTodos(JSON.parse(t));
    } catch {
      /* ignore bad storage */
    }
  }, []);

  function saveTodos(next: Todo[]) {
    setTodos(next);
    localStorage.setItem(TODO_KEY, JSON.stringify(next));
  }
  function markToday() {
    const k = dayKey(new Date());
    if (days.includes(k)) return;
    const next = [...days, k];
    setDays(next);
    localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  }

  async function begin(assignmentId: string, restart = false) {
    if (lock.current) return;
    lock.current = true;
    setStarting(restart ? `${assignmentId}:restart` : assignmentId);
    try {
      const name = alias.trim() || "Demo Student";
      localStorage.setItem(ALIAS_KEY, name);
      markToday();
      const r = await start({ data: { assignmentId, studentName: name, restart } });
      if (r.alreadyCompleted) {
        toast.info("You've already finished this graded assignment. Here's your result.");
        navigate({ to: "/student/result/$sessionId", params: { sessionId: r.sessionId } });
      } else {
        navigate({ to: "/student/session/$sessionId", params: { sessionId: r.sessionId } });
      }
    } catch (e) {
      toast.error(errMsg(e));
      lock.current = false;
      setStarting(null);
    }
  }

  const list = q.data ?? [];
  const byDue = [...list].sort(
    (a, b) => (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) - (b.dueAt ? new Date(b.dueAt).getTime() : Infinity),
  );
  const tests = byDue.filter((a) => a.mode === "graded");
  const homework = byDue.filter((a) => a.mode !== "graded");
  const streak = streakCount(days);
  const doneToday = today ? days.includes(dayKey(today)) : false;
  const dueKeys = new Set(list.filter((a) => a.dueAt).map((a) => dayKey(new Date(a.dueAt!))));
  const calDays = today
    ? Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i - 3);
        return d;
      })
    : [];

  const Card = (a: (typeof list)[number]) => {
    const past = a.dueAt && new Date(a.dueAt).getTime() < Date.now();
    return (
      <article key={a.id} className="rounded-xl bg-card p-4 text-card-foreground shadow-soft">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-md border-2 border-ink bg-secondary px-2 py-0.5">{a.subject}</span>
          {past && (
            <span className="rounded-md border-2 border-ink bg-wrong-soft px-2 py-0.5 text-wrong-foreground">
              Past due
            </span>
          )}
        </div>
        <h3 className="mt-2 text-lg font-bold">{a.title}</h3>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {a.timeLimit} min
          </span>
          <span>{a.confusionCount} ideas</span>
          {a.dueAt && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" /> Due {new Date(a.dueAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={!!starting} onClick={() => begin(a.id)}>
            {starting === a.id ? <Loader2 className="animate-spin" /> : <Play />} Start teaching
          </Button>
          <Button size="sm" variant="outline" disabled={!!starting} onClick={() => begin(a.id, true)}>
            {starting === `${a.id}:restart` ? <Loader2 className="animate-spin" /> : <RotateCcw />} Restart
          </Button>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-night text-midnight-foreground">
      <TopBar
        tone="light"
        right={
          <Link
            to="/teacher"
            search={{}}
            className="text-sm font-semibold text-midnight-foreground/70 hover:text-midnight-foreground"
          >
            Teacher view
          </Link>
        }
      />
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 sm:px-6">
        <section className="flex flex-col items-center gap-5 pt-2 text-center sm:flex-row sm:text-left">
          <Nour mood={doneToday ? "excited" : "curious"} size={96} />
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold sm:text-4xl">Hi {alias.trim() || "there"}! Ready to teach? <Link to="/" className="ml-2 align-middle text-sm font-semibold underline text-midnight-foreground/60">Not you?</Link></h1>
            <p className="mt-1 text-midnight-foreground/75">
              Teach Jonathan at least one idea a day to keep your streak going.
            </p>
          </div>
          <div className="rounded-xl bg-pending p-4 text-center text-ink shadow-soft">
            <Flame className="mx-auto h-7 w-7" />
            <p className="font-display text-3xl font-extrabold">{streak}</p>
            <p className="text-xs font-bold uppercase">day streak</p>
            <p className="mt-1 text-xs">{doneToday ? "Done today!" : "Not yet today"}</p>
          </div>
        </section>

        {/* Horizontal calendar */}
        <section aria-label="Calendar" className="rounded-xl bg-card p-4 text-card-foreground shadow-soft">
          <h2 className="mb-3 text-lg font-bold">Upcoming days</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {calDays.map((d) => {
              const k = dayKey(d);
              const isToday = today && k === dayKey(today);
              const did = days.includes(k);
              return (
                <div
                  key={k}
                  className={`flex min-w-[3.6rem] flex-col items-center rounded-lg border-2 border-ink px-2 py-2 text-sm ${isToday ? "bg-primary text-primary-foreground" : did ? "bg-fixed text-ink" : "bg-background"}`}
                >
                  <span className="text-[10px] font-bold uppercase">
                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                  <span className="font-display text-xl font-extrabold">{d.getDate()}</span>
                  <span className="h-4 text-xs">{did ? "🔥" : dueKeys.has(k) ? "●" : ""}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">🔥 days you taught · ● something due</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Notebook to-do */}
          <section
            aria-label="To-do list"
            className="rounded-xl bg-card text-card-foreground shadow-soft lg:row-span-2"
          >
            <h2 className="border-b-2 border-ink px-4 py-3 text-lg font-bold">My to-do list</h2>
            <ul className="min-h-[14rem] pl-12 pr-3 pt-1" style={notebookLines}>
              {todos.map((t) => (
                <li key={t.id} className="flex h-[2.2rem] items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label={t.text}
                    checked={t.done}
                    onChange={() => saveTodos(todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className={`flex-1 font-hand text-xl ${t.done ? "line-through opacity-50" : ""}`}>
                    {t.text}
                  </span>
                  <button
                    aria-label={`Remove ${t.text}`}
                    onClick={() => saveTodos(todos.filter((x) => x.id !== t.id))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="flex gap-2 border-t-2 border-ink p-3"
              onSubmit={(e) => {
                e.preventDefault();
                const v = newTodo.trim();
                if (!v) return;
                saveTodos([...todos, { id: crypto.randomUUID(), text: v.slice(0, 80), done: false }]);
                setNewTodo("");
              }}
            >
              <Input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a task…"
                maxLength={80}
              />
              <Button type="submit" size="icon" aria-label="Add task">
                <Plus />
              </Button>
            </form>
          </section>

          <section aria-label="Upcoming tests" className="space-y-3 lg:col-span-2">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <ClipboardCheck className="h-5 w-5" /> Tests coming up
            </h2>
            {q.isLoading && <Skeleton className="h-32 rounded-xl bg-midnight-soft" />}
            {q.isError && <ErrorPanel message="Couldn't load your assignments." onRetry={() => q.refetch()} />}
            {q.isSuccess && tests.length === 0 && (
              <p className="rounded-xl border-2 border-dashed border-midnight-foreground/30 p-4 text-sm text-midnight-foreground/70">
                No tests scheduled. Enjoy it!
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">{tests.map(Card)}</div>
          </section>

          <section aria-label="Upcoming homework" className="space-y-3 lg:col-span-2">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <BookOpen className="h-5 w-5" /> Homework
            </h2>
            {q.isLoading && <Skeleton className="h-32 rounded-xl bg-midnight-soft" />}
            {q.isSuccess && homework.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-midnight-foreground/30 p-4 text-sm">
                No homework right now.{" "}
                <Link to="/teacher/assignments/new" className="font-bold underline">
                  A teacher can create one.
                </Link>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">{homework.map(Card)}</div>
          </section>
        </div>

        <StudentVirtualExams studentName={alias.trim() || "Demo Student"} />

        <section aria-label="Jonathan's past exams" className="space-y-3">
          <h2 className="text-2xl">Jonathan's past exams</h2>
          {history.isLoading && <Skeleton className="h-24 bg-midnight-soft" />}
          {history.isError && <ErrorPanel message="Couldn't load past exams." onRetry={() => history.refetch()} />}
          {history.data?.length === 0 && <p className="text-sm text-midnight-foreground/70">No past exams yet.</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.data?.map((exam) => <article key={exam.id} className="rounded-lg bg-card p-4 text-card-foreground shadow-soft">
              <h3 className="font-bold">{exam.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(exam.date).toLocaleDateString()} · {exam.completed ? `${exam.score ?? 0}/${exam.total}` : "In progress"}</p>
              <Button asChild size="sm" variant="outline" className="mt-3"><Link to="/student/exams/$sessionId" params={{ sessionId: exam.id }}><BookOpen /> View solution</Link></Button>
            </article>)}
          </div>
        </section>
      </main>
    </div>
  );
}
