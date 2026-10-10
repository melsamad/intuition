import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, GraduationCap, LayoutGrid, Palette, Sparkles } from "lucide-react";
import { Nour } from "@/components/nour/Nour";
import { TopBar } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";
import { ORB_KEY, ORB_THEMES, applyOrbTheme, savedOrbTheme } from "@/lib/nour/orbTheme";
import { ACCESSORIES, NAME_KEY, saveAccessories, savedAccessories, type AccessoryId } from "@/lib/nour/accessories";
import { Input } from "@/components/ui/input";
import type { Mood } from "@/lib/nour/rules";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Intuition — Teach Jonathan" },
      {
        name: "description",
        content:
          "You teach Jonathan. Jonathan takes your teacher's test. A learning-by-teaching demo where your score is what Jonathan learned.",
      },
      { property: "og:title", content: "Intuition — Teach Jonathan" },
      {
        property: "og:description",
        content: "In 2036, you don't prove you learned something by answering. You prove it by teaching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [stage, setStage] = useState<"loading" | "pick" | "home">("loading");
  useEffect(() => setStage(savedOrbTheme() && localStorage.getItem(NAME_KEY) ? "home" : "pick"), []);
  if (stage === "loading") return <div className="min-h-screen bg-night" />;
  if (stage === "pick") return <Onboarding onDone={() => setStage("home")} />;
  return <Home onCustomize={() => setStage("pick")} />;
}

const MOODS: Mood[] = ["excited", "curious", "neutral"];

function Onboarding({ onDone }: { onDone: () => void }) {
  const [sel, setSel] = useState(savedOrbTheme() ?? ORB_THEMES[0]!.id);
  const [worn, setWorn] = useState<AccessoryId[]>(() => (typeof window === "undefined" ? [] : savedAccessories()));
  const [name, setName] = useState(() => (typeof window === "undefined" ? "" : localStorage.getItem(NAME_KEY) ?? ""));
  const [bump, setBump] = useState(0);
  useEffect(() => applyOrbTheme(sel), [sel]);
  const theme = ORB_THEMES.find((t) => t.id === sel)!;
  const cleanName = name.trim().slice(0, 40);

  function toggle(id: AccessoryId) {
    setWorn((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
    setBump((b) => b + 1);
  }

  function choose(e: React.FormEvent) {
    e.preventDefault();
    if (!cleanName) return;
    localStorage.setItem(ORB_KEY, sel);
    localStorage.setItem(NAME_KEY, cleanName);
    saveAccessories(worn);
    onDone();
  }

  return (
    <div className="min-h-screen bg-night text-midnight-foreground">
      <TopBar tone="light" />
      <form onSubmit={choose} className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-16 pt-4 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-glow">Meet your student</p>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Meet Jonathan</h1>
        <p className="mt-3 max-w-md text-midnight-foreground/75">
          He's the student you'll be teaching. Pick his glow, dress him up, and tell him your name!
        </p>
        <div key={bump} className="my-12 animate-rise">
          <Nour mood={MOODS[bump % MOODS.length] ?? "curious"} size={170} worn={worn} />
        </div>

        <p className="font-display text-xl font-bold">1. His glow: {theme.name}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4" role="radiogroup" aria-label="Jonathan's colour">
          {ORB_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={sel === t.id}
              aria-label={t.name}
              onClick={() => {
                setSel(t.id);
                setBump((b) => b + 1);
              }}
              className={cn(
                "h-14 w-14 rounded-full transition hover:scale-110",
                sel === t.id
                  ? "scale-110 ring-4 ring-midnight-foreground ring-offset-4 ring-offset-midnight"
                  : "opacity-80",
              )}
              style={{ background: `radial-gradient(circle at 35% 30%, ${t.a}, ${t.b} 60%, ${t.c})` }}
            />
          ))}
        </div>

        <p className="mt-10 font-display text-xl font-bold">2. Dress him up</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2" role="group" aria-label="Jonathan's accessories">
          {ACCESSORIES.map((a) => (
            <Button key={a.id} type="button" size="sm" variant={worn.includes(a.id) ? "glow" : "night"} aria-pressed={worn.includes(a.id)} onClick={() => toggle(a.id)}>
              {a.name}
            </Button>
          ))}
        </div>

        <label htmlFor="student-name" className="mt-10 font-display text-xl font-bold">3. What's your name?</label>
        <Input
          id="student-name"
          value={name}
          maxLength={40}
          autoComplete="given-name"
          placeholder="Your first name"
          onChange={(e) => setName(e.target.value)}
          className="mt-4 h-12 max-w-xs bg-card text-center text-lg text-card-foreground"
        />
        <p className="mt-2 text-xs text-midnight-foreground/60">Only saved on this device. A nickname is fine.</p>

        <Button type="submit" variant="glow" size="lg" className="mt-8" disabled={!cleanName}>
          <Sparkles /> {cleanName ? `Hi Jonathan, I'm ${cleanName}!` : "That's my Jonathan"}
        </Button>
      </form>
    </div>
  );
}

function Home({ onCustomize }: { onCustomize: () => void }) {
  return (
    <div className="min-h-screen bg-night text-midnight-foreground">
      <TopBar
        tone="light"
        right={
          <button
            onClick={onCustomize}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-midnight-foreground/70 hover:text-midnight-foreground"
          >
            <Palette className="h-4 w-4" /> Customize Jonathan
          </button>
        }
      />
      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-6 text-center sm:px-6 sm:pt-12">
        <Nour mood="curious" size={140} />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-glow">Teach Jonathan</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
          In 2036, you don't prove you learned something by answering.
          <span className="block text-glow">You prove it by teaching.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-midnight-foreground/75 sm:text-lg">
          You teach Jonathan. Jonathan takes your teacher's test. Jonathan starts with three wrong ideas, and only
          changes his mind when you give a real reason and an example.
        </p>

        <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          <RoleCard
            to="/student"
            icon={<GraduationCap />}
            title="I'm a student"
            body="Open tonight's assignment and help Jonathan understand."
          />
          <RoleCard
            to="/teacher"
            icon={<LayoutGrid />}
            title="I'm a teacher"
            body="See your class misconception map and every explanation."
          />
        </div>

        <p className="mt-8 max-w-lg text-xs text-midnight-foreground/55">
          Live demo with no login. Choosing a role only switches the view. The teacher dashboard includes 24 fictional
          sample students.
        </p>
      </main>
    </div>
  );
}

function RoleCard({
  to,
  icon,
  title,
  body,
}: {
  to: "/student" | "/teacher";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-3xl border border-midnight-foreground/15 bg-midnight-soft/70 p-6 text-left backdrop-blur transition hover:-translate-y-0.5 hover:border-glow/60"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orb text-midnight shadow-glow [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </span>
      <span className="flex-1">
        <span className="flex items-center justify-between font-display text-xl font-bold">
          {title}
          <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
        </span>
        <span className="mt-1 block text-sm text-midnight-foreground/70">{body}</span>
      </span>
    </Link>
  );
}
